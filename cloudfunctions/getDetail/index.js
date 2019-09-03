// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  console.log(event.session_id)
  let session = (await db.collection('chatcontent').where({
    _id: event.session_id
  }).get()).data[0];
  let res =  {}
  res.status = session.status

  const fileList = [session.finder.url, session.findee.url]
  const result = await cloud.getTempFileURL({
    fileList: fileList,
  })
  session.finder.url = result.fileList[0].tempFileURL || ""
  session.findee.url = result.fileList[1].tempFileURL
  
  res.finder = session.finder
  res.findee = session.findee
  res.taskid = session._id
  res.wxid =session.wxid
  return res
}