// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()

  taskid = event.taskid
  const db = cloud.database()
  const _ = db.command
  //const tmp = (await db.collection('task_table').where({
  //  _id: event.taskid
  //}).get()).data[publisher_id]
  let session = (await db.collection('chatcontent').where({
    _id: event.session_id
  }).get()).data[0];
  console.log(event)
  console.log(event.type)
  let finderurl = session.finder.url
  let findeeurl = session.findee.url
  let status = session.status
  let wxstatus =session.wxstatus
  if (event.type == "launchMask" && session.status == "init") //askWechat
  {
    console.log(event.data.imgUrl)
    status = "launchMask"
    if (wxContext.OPENID == session.finder.openid) {
      finderurl = event.data.imgUrl

    } else {
      findeeurl = event.data.imgUrl
    }
    console.log(finderurl)
    console.log(findeeurl)
  } else if (event.type == "acceptMask") {
    status = "acceptMask"
    if (wxContext.OPENID == session.finder.openid) {
      finderurl = event.data.imgUrl
    } else {
      findeeurl = event.data.imgUrl
    }
      
  } else if (event.type == "refuseMask") {
     status = "end"
  }


if (event.type == "askWechat" && session.wxstatus == "init") //askWechat
  {
    wxstatus = "askWechat"
  } else if (event.type == "acceptWx") {
    status = "acceptWx"   
  } else if (event.type == "refuseWx") {
     wxstatus = "end"
  }

  if (session.finder.openid == wxContext.OPENID || session.findee.openid == wxContext.OPENID) {
    await db.collection('chatcontent').where({
      _id: event.session_id
    }).update({
      data: {
        contents: _.push({
          content: {
            type: event.type,
            data: event.data,
          },
          sender: wxContext.OPENID,
          timestamp: Date.now()
        }),
        status: status,
        finder:{
          url: finderurl
        },
        findee:{
          url: findeeurl
        },
        wxstatus: wxstatus
      }
    })
    return "ok"
  } else {
    return "push failed for Authentication"
  }
}