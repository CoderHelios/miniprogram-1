const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
exports.main = async(event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    console.log(event)

    task = (await db.collection('task_table').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        title: event.title,
        content: event.content,
        published_time: Date.now(),
        clicked_num: 0,
        school: event.school,
        gold: event.gold,
        consumed_num: 0,
        publisher_id: wxContext.OPENID,
        close_time: event.close_time,
        cover: event.cover
      }
    }))

    await db.collection("userinfo_table").where({
      openid: wxContext.OPENID,
    }).update({
      data: {
        school: event.school
      }
    })
    //begin
    await db.collection('message').add(
      {
        data:{
          openid: wxContext.OPENID,
        }
      }
    )
    //end
    console.log(task)
  } catch (e) {
    console.error(e)
  }

  return task
}