Page({
  data: {
    polls: [],
    is_admin: false,
    union_id: null
  },

  onLoad() {
    this.do_login_and_load_polls();
  },

  async do_login_and_load_polls() {
    const app = getApp();
    wx.showLoading({ title: '加载中...' });
    try {
      // 确保 app.js 中的 do_login 存在
      if (typeof app.do_login !== 'function') {
        throw new Error('app.js 中缺少 do_login 方法');
      }
      await app.do_login();
      this.setData({ 
        union_id: app.global_data.union_id,
        is_admin: app.global_data.is_admin
      });
      // 登录成功后，接着加载投票列表
      this.load_polls();
    } catch (e) {
      wx.hideLoading();
      const error_msg = typeof e === 'string' ? e : (e.message || '未知登录错误');
      wx.showToast({ title: `登录失败: ${error_msg}`, icon: 'none', duration: 3000 });
    }
  },

  load_polls() {
    wx.cloud.callFunction({
      name: 'get_polls'
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        this.setData({ polls: res.result.data });
      } else {
        // 如果云函数返回了具体的错误信息，就显示它
        const error_msg = (res.result && res.result.error) ? res.result.error.errMsg || '云函数返回失败' : '加载投票列表失败';
        wx.showToast({ title: `加载数据失败: ${error_msg}`, icon: 'none', duration: 3000 });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: `调用get_polls失败: ${err.errMsg || '未知错误'}`, icon: 'none', duration: 3000 });
    });
  },

  on_poll_tap(e) {
    const poll_id = e.currentTarget.dataset.id;
    const is_creator = e.currentTarget.dataset.iscreator;
    if (this.data.is_admin && is_creator) {
      wx.navigateTo({ url: `/pages/admin/edit/edit?pollId=${poll_id}` });
    } else {
      wx.navigateTo({ url: `/pages/poll/vote/vote?pollId=${poll_id}` });
    }
  },

  on_create_tap() {
    wx.navigateTo({ url: '/pages/admin/create/create' });
  },

  onPullDownRefresh() {
    this.load_polls();
    wx.stopPullDownRefresh();
  }
});
