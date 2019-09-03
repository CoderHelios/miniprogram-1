// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const db = cloud.database()
  const flag = event.choice
  let status = ""
  taskid = ( await db.collection('task_line').where(
    {
      sessionid: event.session_id,
    }
  ).get()).data[0].taskid
  if (flag) {
    status = "success"
    await db.collection('task_table').where({
      _id: taskid
    }).update(
      {
        data:{
          globalstatus: "successs"
        }
      }
    )

    await db.collection('chatcontent').where({
      _id: event.session_id
    }).update(
      {
        data: {
          globalstatus: "successs"
        }
      }
    )

  }
  else {
    status = "failed"
    await db.collection('chatcontent').where({
      _id: event.session_id
    }).update(
      {
        data: {
          globalstatus: "failed"
        }
      }
    )

  }
  await db.collection('task_line').where(
    {
      sessionid: event.session_id,
    }
  ).update(
    {
      data: {
        status: status
      }
    }
  )
  return "ok"
}