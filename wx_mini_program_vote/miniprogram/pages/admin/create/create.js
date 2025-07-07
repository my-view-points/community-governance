// pages/admin/create/create.js
const app = getApp();

Page({
  data: {
    title: '',
    description: '',
    options: ['', ''] // 默认两个选项
  },

  add_option() {
    this.setData({
      options: [...this.data.options, '']
    });
  },

  remove_option(e) {
    const index = e.currentTarget.dataset.index;
    const new_options = [...this.data.options];
    new_options.splice(index, 1);
    this.setData({
      options: new_options
    });
  },

  async create_poll() {
    // 确保已登录并获取到UnionID
    if (!app.global_data.union_id) {
      wx.showLoading({ title: '正在获取用户信息...' });
      try {
        await app.do_login();
        wx.hideLoading();
      } catch (e) {
        wx.hideLoading();
        wx.showToast({ title: '获取用户信息失败', icon: 'none' });
        return;
      }
    }

    const { title, description, options } = this.data;
    if (!title.trim() || options.some(opt => !opt.trim())) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在创建...' });
    wx.cloud.callFunction({
      name: 'create_poll',
      data: {
        title,
        description,
        options: options.filter(opt => opt.trim()),
        admin_union_id: app.global_data.union_id
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '创建成功' });
        // 跳转到投票页面
        wx.navigateTo({
          url: `/pages/poll/vote/vote?pollId=${res.result.pollId}`,
        });
      } else {
        wx.showToast({ title: '创建失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '创建失败', icon: 'none' });
      console.error(err);
    });
  }
});
