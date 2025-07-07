// cloudfunctions/manage_poll/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 主要的管理函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const user_open_id = wxContext.OPENID;
  const userUnionid = wxContext.UNIONID;

  const { pollId, action, data } = event;

  // 1. 获取投票数据
  const pollRes = await db.collection('polls').doc(pollId).get();
  if (!pollRes.data) {
    return { success: false, error: '投票不存在' };
  }
  const poll = pollRes.data;

  // 2. 权限判断
  const is_creator = userUnionid === poll.admin_union_id;

  // 3. 根据action执行不同操作
  switch (action) {
    // 绑定群组
    case 'bind_group': {
      if (!is_creator) {
        return { success: false, error: '无权操作' };
      }
      const { share_ticket: share_ticket } = data;
      if (!share_ticket) {
        return { success: false, error: '缺少share_ticket' };
      }
      // 解密share_ticket获取openGid
      const open_data = await cloud.getOpenData({ list: [share_ticket] });
      const open_group_id = open_data.list[0].data.openGId;

      // 使用原子操作更新，防止重复添加
      await db.collection('polls').doc(pollId).update({
        data: {
          authorized_group_ids: _.addToSet(open_group_id)
        }
      });
      return { success: true };
    }

    // 投票
    case 'vote': {
      // 检查是否已投过票
      if (poll.voters && poll.voters[user_open_id]) {
        return { success: false, error: '您已经投过票了' };
      }
      
      const { optionId: option_id } = data;
      const option_index = poll.options.findIndex(o => o.id === option_id);
      if (option_index === -1) {
        return { success: false, error: '选项不存在' };
      }

      // 更新投票数和投票者记录
      const update_path = `options.${option_index}.count`;
      const voter_path = `voters.${user_open_id}`;
      await db.collection('polls').doc(pollId).update({
        data: {
          [update_path]: _.inc(1),
          [voter_path]: option_id
        }
      });
      return { success: true };
    }

    // 获取投票详情（默认）
    default: {
      let can_vote = false;
      let source_group_id = null;

      // 如果是创建者，直接可以投票
      if (is_creator) {
        can_vote = true;
      } else {
        // 如果不是创建者，检查来源群
        if (event.share_ticket) {
          try {
            const open_data = await cloud.getOpenData({ list: [event.share_ticket] });
            source_group_id = open_data.list[0].data.openGId;
            if (poll.authorized_group_ids.includes(source_group_id)) {
              can_vote = true;
            }
          } catch(e) {
            wx.showToast({ title: "解密share_ticket失败: " + e, icon: 'none' });
          }
        }
      }
      
      // 检查用户是否已投票
      const user_voted_option = (poll.voters && poll.voters[user_open_id]) || null;
      if (user_voted_option) {
        can_vote = false; // 如果已投票，则不能再投
      }

      return {
        success: true,
        data: {
          ...poll,
          is_creator,
          can_vote,
          user_voted_option
        }
      };
    }
  }
}
