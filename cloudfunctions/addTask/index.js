// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
exports.main = async (event, context) => {
  try {
    //const wxContext = cloud.getWXContext()
    return await db.collection('task_table').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        title: event.title, 
        content: event.content, 
        published_time: event.published_time, 
        clicked_num: event.clicked_num, 
        school: event.school, 
        gold: event.gold, 
        consumed_num: event.consumed_num,
        publisher_id: event.openid,//wxContext.OPENID, 
        close_time: event.close_time
      }
    })
  }
  catch (e) {
    console.error(e)
  }
}

