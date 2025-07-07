// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      wx.showToast({ title: "请使用 2.2.3 或以上的基础库以使用云能力", icon: 'none' });
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入你的环境 ID, 环境 ID 可打开云控制台查看
        env: '', // 替换成你的环境ID
        traceUser: true,
      });
    }

    this.global_data = {
      user_info: null,
      open_id: null,
      union_id: null,
    };

    this.do_login();
  },

  // 封装一个异步的登录函数，以便页面可以等待登录完成后再执行操作
  do_login: function() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login'
      }).then(res => {
        if (res.result && res.result.open_id) {
          this.global_data.open_id = res.result.open_id;
          this.global_data.union_id = res.result.union_id;
          console.log('[App] 登录成功, UnionID:', this.global_data.union_id);
          resolve(res.result);
        } else {
          reject('登录失败');
        }
      }).catch(err => {
        wx.showToast({ title: "登录失败", icon: 'none' });
        reject(err);
      });
    })
  }
});
