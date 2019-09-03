// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command
const MAX_CONSUME_NUM = 10
// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  var consumers = event.consumers
  var task_id = event.task_id
  var openId = wxContext.OPENID
  //var openId = event.openId
  //查询task链路数量
  var consumed_num = (await db.collection('task_table').where({
    _id: task_id
  }).field({
    consumed_num: true
  }).get()).data[0].consumed_num;
  userIconList = (await db.collection('userinfo_table').where({
    openid: openId
  }).field({
    icon_url: true
  }).get()).data
  userIcon = userIconList[0] ? userIconList[0].icon_url : '';

  var info = {
    iconUrl: userIcon,
    openid: openId,
  }
  if (consumed_num < 10) {


    switch (event.action) {
      //放到addtaskline，更新tasktable加一
      case 'join':
        {
          var add_taskline_id = await addTaskLine('passing', info, task_id)
          console.log('join:' + add_taskline_id)
          updateTaskTableAddNum(task_id)
          updateUserTableAddtaskLineid(openId, add_taskline_id);
          break;
        }
        //放到addtaskline，更新tasktable加一
      case 'showUp':
        {
          var add_taskline_id = await addTaskLine('suspect', info, task_id);
          console.log('showUp:' + add_taskline_id)
          await updateTaskTableAddNum(task_id);
          await updateUserTableAddtaskLineid(openId, add_taskline_id);
          let session_id = await createSession(task_id, add_taskline_id, openId)
          //begin
          await db.collection('message').add({
            data:{
              openid: (await db.collection('task_table').where({
                _id: task_id
              }).get()).data[0].publisher_id,
              type: "chatInvite",
              session_id
            }
          })
          //end
          break;
        }
    }
    return {
      res: "add ok"
    }
  } else {
    return null
  }
}

//没有任务的新增任务
async function addTaskLine(status, info, task_id) {
  var list = []
  list.push(info)
  return await db.collection('task_line').add({
    data: {
      consumers: list,
      status: status,
      task_id: task_id,
      sessionid: "",
    }
  }).then(res => {
    return Promise.resolve(res._id)
  })

}
async function updateTaskTableAddNum(taskId) {
  return await db.collection('task_table').where({
    _id: taskId
  }).update({
    data: {
      consumed_num: _.inc(1)
    },
  })
}

/**
 * 添加tasklineid到userinfo
 */
async function updateUserTableAddtaskLineid(openid, taskLineId) {
  //先查在改
  var idList = (await db.collection('userinfo_table').where({
      openid: openid,
    }).field({
      task_line_id: true
    })
    .get()).data[0].task_line_id
  //查找是否已经存在tasklineid
  if (idList.length > 0) {
    var flag = idList.find(function(item) {
      return item === taskLineId
    })
    //不存在则添加
    if (!flag) {
      await db.collection('userinfo_table').where({
        openid: openid
      }).update({
        data: {
          task_line_id: _.push(taskLineId)
        },
      })
    }
  } else {
    //直接添加
    await db.collection('userinfo_table').where({
      openid: openid
    }).update({
      data: {
        task_line_id: _.push(taskLineId)
      },
    })
  }
}
async function createSession(taskid, linkid, openid) {
  temp = (await db.collection("task_table").where({
    _id: taskid
  }).get()).data[0]
  let sessionid = (await db.collection('chatcontent').add({
    // data 字段表示需新增的 JSON 数据
    data: {
      finder: {
        openid: temp.publisher_id,
        url: ""
      },
      findee: {
        openid: openid,
        url: ""
      },
      taskid: taskid,
      contents: [],
      status: "init",
      wxstatus: "init"
    }
  }))._id

  await db.collection('task_line').where({
    _id: linkid
  }).update({
    data: {
      sessionid: sessionid
    }
  })
  return sessionid
}