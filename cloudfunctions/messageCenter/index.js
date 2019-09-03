// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const tasks = (await db.collection('task_table').where({
    publisher_id: wxContext.OPENID
  }).get()).data;
  let session = []
  tasks.forEach((task) => {
    session.push(task.session_id)
  })
  return session
}