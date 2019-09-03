const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
exports.main = async(event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    console.log(event)
    task = await createTaskTable(event, wxContext)
    //更新选择的学校
    await updateSchool(wxContext, event);
    //创建message表
    await createMessageById(wxContext);
    console.log(task)
  } catch (e) {
    console.error(e)
  }

  return task
}

async function createMessageById(wxContext) {
  await db.collection('message').add({
    data: {
      openid: wxContext.OPENID,
    }
  });
}

async function updateSchool(wxContext, event) {
  await db.collection("userinfo_table").where({
    openid: wxContext.OPENID,
  }).update({
    data: {
      school: event.school
    }
  });
}

async function createTaskTable(event, wxContext) {
  return (await db.collection('task_table').add({
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
  }));
}
