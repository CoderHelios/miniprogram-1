// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const info = (await db.collection('userinfo_table')
    .where({
      openid: wxContext.OPENID
    }).get()).data[0]
  
  info && (info.school = (await db.collection("school").where({
    _id: info.school
  }).get()).data[0])

  return info
}