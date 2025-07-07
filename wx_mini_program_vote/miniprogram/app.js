// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      wx.showToast({ title: "请使用 2.2.3 或以上的基础库以使用云能力", icon: 'none' });
    } else {
      wx.cloud.init({
        env: 'cloud1-7gnkt7rzee36bb46', // 替换成你的环境ID
        traceUser: true,
      });
    }

    this.global_data = {
      user_info: null,
      open_id: null,
      union_id: null,
      is_admin: false, // 新增管理员状态
      admin_union_id: "" // 在这里填入你的UnionID
    };
  },

  // 封装一个异步的登录函数
  do_login: function() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login'
      }).then(res => {
        if (res.result && res.result.union_id) {
          this.global_data.open_id = res.result.open_id;
          this.global_data.union_id = res.result.union_id;
          // 判断是否为管理员
          if (this.global_data.union_id === this.global_data.admin_union_id) {
            this.global_data.is_admin = true;
          }
          console.log('[App] 登录成功, UnionID:', this.global_data.union_id, 'Is Admin:', this.global_data.is_admin);
          resolve(res.result);
        } else {
          reject('登录失败，无法获取UnionID');
        }
      }).catch(err => {
        wx.showToast({ title: "登录调用失败", icon: 'none' });
        reject(err);
      });
    })
  }
});
