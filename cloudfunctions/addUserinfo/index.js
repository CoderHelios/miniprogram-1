const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
exports.main = async (event, context) => {
  console.log(event)
  try {
    const wxContext = cloud.getWXContext()
    if ((await db.collection('userinfo_table').where(
      {
        openid: wxContext.OPENID,
      }
    ).get()).data.length == 0)
    {
      return await addUserInfo(event, wxContext)
    }
    else
    {
      return await updateUserInfo(wxContext, event)
    }
    }
  catch (e) {
    console.error(e)
  }
}

async function updateUserInfo(wxContext, event) {
  return await db.collection('userinfo_table').where({
    openid: wxContext.OPENID,
  })
    .update({
      // data 字段表示需新增的 JSON 数据
      data: {
        icon_url: event.avatarUrl,
        scores: event.scores,
        nickname: event.nickName,
        sex: event.gender,
        school: event.province,
        real_icon_id: event.real_icon_id,
        openid: wxContext.OPENID,
      }
    });
}

async function addUserInfo(event, wxContext) {
  return await db.collection('userinfo_table')
    .add({
      // data 字段表示需新增的 JSON 数据
      data: {
        icon_url: event.avatarUrl,
        scores: event.scores,
        nickname: event.nickName,
        sex: event.gender,
        school: "d43f6124-eda6-4f8a-942e-b1e9696cd24c",
        real_icon_id: event.real_icon_id,
        openid: wxContext.OPENID,
        task_line_id: [],
      }
    });
}
