// pages/poll/vote/vote.js
const app = getApp();

Page({
  data: {
    poll_id: null,
    poll_data: null,
    selected_option_id: null
  },

  onLoad(options) {
    this.setData({ poll_id: options.pollId });
    // 开启群分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
    this.get_poll_details(options.share_ticket);
  },

  // 获取投票详情和权限
  get_poll_details(share_ticket) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'manage_poll',
      data: {
        poll_id: this.data.poll_id,
        action: 'get_details',
        share_ticket: share_ticket // 无论有无都传入
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        const poll_data = res.result.data;
        // 计算投票百分比
        const total_votes = poll_data.options.reduce((sum, opt) => sum + opt.count, 0);
        poll_data.options.forEach(opt => {
          opt.percent = total_votes === 0 ? 0 : ((opt.count / total_votes) * 100).toFixed(1);
        });
        this.setData({ poll_data: poll_data });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
      console.error(err);
    });
  },

  onRadioChange(e) {
    this.setData({ selected_option_id: e.detail.value });
  },

  // 提交投票
  submit_vote() {
    wx.showLoading({ title: '正在提交...' });
    wx.cloud.callFunction({
      name: 'manage_poll',
      data: {
        poll_id: this.data.poll_id,
        action: 'vote',
        data: {
          option_id: this.data.selected_option_id
        }
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '投票成功' });
        // 重新加载数据以显示最新结果
        this.get_poll_details();
      } else {
        wx.showToast({ title: res.result.error || '投票失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '投票失败', icon: 'none' });
    });
  },

  // 分享逻辑
  onShareAppMessage(res) {
    // 来自于管理员的“绑定群”按钮
    if (res.from === 'button' && res.target.dataset.action === 'bind_group') {
      // 返回一个Promise，以便在获取到share_ticket后执行绑定操作
      return {
        title: `邀请您群加入投票: ${this.data.poll_data.title}`,
        path: `/pages/poll/vote/vote?pollId=${this.data.poll_id}`,
        // 开启 share_ticket
        withShareTicket: true,
        success: (shareRes) => {
          // shareRes.share_tickets[0] 是我们需要的
          if (shareRes.share_tickets && shareRes.share_tickets.length > 0) {
            wx.cloud.callFunction({
              name: 'manage_poll',
              data: {
                pollId: this.data.poll_id,
                action: 'bind_group',
                data: {
                  share_ticket: shareRes.share_tickets[0]
                }
              }
            }).then(() => {
              wx.showToast({ title: '群组绑定成功！' });
            });
          }
        }
      }
    }

    // 普通分享
    return {
      title: this.data.poll_data.title,
      path: `/pages/poll/vote/vote?pollId=${this.data.poll_id}`,
      withShareTicket: true
    }
  },

  onPullDownRefresh() {
    this.get_poll_details();
    wx.stopPullDownRefresh();
  }
});

