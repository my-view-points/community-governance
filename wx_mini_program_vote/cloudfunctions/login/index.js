// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 这个示例将经自动鉴权过的小程序用户 open_id 返回给小程序端
 * * event 参数包含小程序端调用传入的 data
 * */
exports.main = async (event, context) => {
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、UNIONID
  const wx_context = cloud.getWXContext()

  return {
    event,
    open_id: wx_context.OPENID,
    app_id: wx_context.APPID,
  }
}
