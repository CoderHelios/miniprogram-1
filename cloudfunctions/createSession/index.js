// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  temp = (await db.collection("task_table").where({
    _id: event.taskid
  }).get()).data[0]
  let sessionid = (await db.collection('chatcontent').add({
    // data 字段表示需新增的 JSON 数据
    data: {
      finder: {
        openid: temp.publisher_id,
        url: ""
      },
      findee: {
        openid: wxContext.OPENID,
        url: ""
      },
      taskid: event.taskid,
      contents: [],
      status: "init",
      wxstatus: "init"
    }
  }))._id

  await db.collection('task_line').where(
    {
      _id: event.link_id
    }
  ).update(
    {
      data: {
        sessionid: sessionid
      }
    }
  )
}
