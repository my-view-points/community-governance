const app = getApp();

Page({
  data: {
    poll_id: null,
    poll_data: null,
    title: '',
    description: ''
  },

  onLoad(options) {
    this.setData({ poll_id: options.pollId });
    this.get_poll_details();
  },

  get_poll_details() {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'manage_poll',
      data: {
        pollId: this.data.poll_id,
        action: 'get_details'
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        const poll_data = res.result.data;
        this.setData({ 
          poll_data: poll_data,
          title: poll_data.title,
          description: poll_data.description
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  on_title_input(e) {
    this.setData({ title: e.detail.value });
  },

  on_desc_input(e) {
    this.setData({ description: e.detail.value });
  },

  update_poll() {
    const { title, description } = this.data;
    if (!title.trim() || !description.trim()) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在更新...' });
    wx.cloud.callFunction({
      name: 'manage_poll',
      data: {
        pollId: this.data.poll_id,
        action: 'update_poll',
        data: {
          title: this.data.title,
          description: this.data.description
        }
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '更新成功' });
        // 返回上一页并刷新
        const pages = getCurrentPages();
        const prev_page = pages[pages.length - 2];
        prev_page.load_polls();
        wx.navigateBack();
      } else {
        wx.showToast({ title: '更新失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '更新失败', icon: 'none' });
    });
  }
});
