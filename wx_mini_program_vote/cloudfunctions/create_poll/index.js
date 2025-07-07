// cloudfunctions/createPoll/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 创建集合
exports.main = async (event, context) => {
  const wx_context = cloud.getWXContext()
  const { title, description, options, admin_open_id } = event;

  try {
    // 准备选项数据，每个选项都包含一个count字段
    const poll_options = options.map((optionText, index) => ({
      id: `opt_${Date.now()}_${index}`,
      text: optionText,
      count: 0
    }));

    const result = await db.collection('polls').add({
      data: {
        title,
        description,
        options: poll_options,
        admin_open_id, // 绑定的管理员UnionID
        authorized_group_ids: [], // 授权的群Gid列表，初始为空
        voters: {}, // 投票者记录，防止重复投票
        creator_open_id: wx_context.OPENID, // 记录创建者的OpenID
        create_time: new Date()
      }
    })
    return {
      success: true,
      pollId: result._id
    }
  } catch (e) {
    console.error('create_poll failed', e)
    return {
      success: false,
      error: e
    }
  }
}
