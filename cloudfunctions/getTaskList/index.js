// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  if (event.openid != null) {
    if (event.publish) {
      //发布的
      return (await db.collection('task_table').where({
          publisher_id: event.openid,
        })
        .orderBy('published_time', 'desc')
        .skip(event.start)
        .limit(event.num)
        .get()).data
    } else {
      //参与的
      //1.查询该用户参与了哪些
      //2.把查到的id保存
      //3.到数据库一个个查，返回任务集合
      var idList = (await db.collection('userinfo_table').where({
          openid: event.openid,
        }).field({
          task_line_id: true
        })
        .get()).data[0].task_line_id 
      var result = []
      // var sdd = (await db.collection('task_line').where({
      //   task_id: idList[0],
      // }).get())
      // console.log("canyu::" +   sdd)
      idList.forEach(async function(element, index) {
        console.log('element:'+ element)
        var item = (await db.collection('task_line').where({
          _id: element,
        }).get()).data
        result.push(item)
      })
      return {
        res: result
      }
    }
  }

  console.info(event.sort)

  switch(event.sort || 0) {
    case 0:{ // 按照时间
      //根据时间
      return (await db.collection('task_table')
        .orderBy('published_time', 'desc')
        .skip(event.start)
        .limit(event.num)
        .get()).data

    }
    case 1: { // 按照click
      //根据热度
      
        return (await db.collection('task_table')
          .orderBy('clicked', 'desc')
          .skip(event.start)
          .limit(event.num)
          .get()).data
      
    }
    case 2: { // 按照Gold
      //根据赏金
        return (await db.collection('task_table')
          .orderBy('gold', 'desc')
          .skip(event.start)
          .limit(event.num)
          .get()).data
    }

  }

 
  return (await db.collection('task_table')
    .orderBy('published_time', 'desc')
    .skip(event.start)
    .limit(event.num)
    .get()).data



}