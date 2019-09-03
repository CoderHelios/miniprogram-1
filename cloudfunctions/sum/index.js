// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
// 云函数入口函数
exports.main = (event, context) => {
  console.log(event.published_time)
  console.log(new Date().getTime().toString())
  const wxContext = cloud.getWXContext()
  return {
    sum: event.a + event.b,
    openid: wxContext.OPENID,
  }
}