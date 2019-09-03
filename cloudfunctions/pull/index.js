// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  let session = (await db.collection('chatcontent').where({
    _id: event.session_id
  }).get()).data[0];

  if (session.finder.openid == wxContext.OPENID || session.findee.openid == wxContext.OPENID)
  {
    let list = session.contents.filter((item) => {
      return (item.timestamp > event.timestamp)
    })

    const findeeInfo = (await db.collection('userinfo_table')
      .where({
        openid: session.findee.openid
      }).get()).data[0] || {}
    const finderInfo = (await db.collection('userinfo_table')
      .where({
        openid: session.finder.openid
      }).get()).data[0] || {}
    console.log(findeeInfo, finderInfo)
    const map = {};
    map[findeeInfo.openid] = findeeInfo;
    map[finderInfo.openid] = finderInfo;

    list.forEach((item) => {
      item.sender = map[item.sender] || {}
    })
    return list
  }
  else
  {
    return "pull failed for Authentication"
  }
}