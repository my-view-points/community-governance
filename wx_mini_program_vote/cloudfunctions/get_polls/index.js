// cloudfunctions/get_polls/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 获取投票列表
exports.main = async (event, context) => {
  try {
    const polls_res = await db.collection('polls').orderBy('create_time', 'desc').get();
    return {
      success: true,
      data: polls_res.data
    }
  } catch (e) {
    return {
      success: false,
      error: e
    }
  }
}
