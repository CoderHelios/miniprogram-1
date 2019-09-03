// 云函数入口文件
const cloud = require('./node_modules/wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  return (await db.collection("school").get()).data
}