// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command
var task_id = ''
var link_id = ''
const MAX_CURRENT_LINE_NUM = 6
const MAX_CONSUME_NUM = 10
const TASK_TABLE = 'task_table'
const TASK_LINE_TABLE = 'task_line'
// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID
  // const openId = event.openid
  var userIcon = ""
  var taskId = ""
  task_id = event.task_id
  link_id = event.link_id
  const action = event.action
  var created = 'created'
  var passing = 'passing'
  var suspect = 'suspect'
  var task_line_nums = 0
  var currentLineNum = 0
  /**
   * 点击参加任务
   * 
   * 1.查用户表，获得icon
   * 1.更新任务链路表 或 新增任务链路表
   * 2.更新任务表，消费数+1
   * 3.更新用户表，更新tasklineid
   */
  try {
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

    //查询task链路数量
    var consumed_num = (await db.collection('task_table').where({
      _id: task_id
    }).field({
      consumed_num: true
    }).get()).data[0].consumed_num;
    //查询taskLine的消费情况
    var taskLine_consumed_num = (await db.collection(TASK_LINE_TABLE).where({
      _id: link_id
    }).field({
      consumers: true
    }).get()).data[0].consumers.length;


    //查询tasktable状态
    var task_table_status = (await db.collection('task_table').where({
      _id: task_id
    }).field({
      status: true
    }).get()).data[0].status;
    console.log('consume_num:' + consumed_num + 'status::' + task_table_status + 'taskLine_consumed_num::' + taskLine_consumed_num)

    switch (action) {

      case 'passOn':
        {
          //链路传递数量大于等于上限，返回空值
          if (taskLine_consumed_num >= MAX_CURRENT_LINE_NUM) {
            return null
          } else {
            await changeLinkStatus('passing', link_id);
            await updateTaskLine(link_id, info);
          }
          break;
        }

      case 'admit':
        {
          await changeLinkStatus('suspect', link_id);
          await updateTaskLine(link_id, info);
          let session_id = await createSession(task_id, link_id, openId);
          pushMes(getTaskPublisher(task_id), 'chatInvite', {
            session_id
          });
          break;
        }
      case 'reject':
        {
          await changeLinkStatus('failed', link_id)
          break;

        }
      case 'close':
        {
          await changeLinkStatus('failed', link_id)
          break;
        }
      case 'success':
        {
          await changeLinkStatus('success', link_id)
          await changeTaskStatus('success', link_id)
          break;
        }
      case 'giveUp':
        {
          await changeLinkStatus('failed', link_id)
          break;
        }
    }
    updateUserTableAddtaskLineid(openId, link_id)

  } catch (e) {
    console.error(e)
  }
  return 'update ok'
}

async function changeLinkStatus(status, linkId) {
  await db.collection(TASK_LINE_TABLE).where({
    _id: linkId
  }).update({
    data: {
      status: status,
    },
  })
}

async function changeTaskStatus(status, taskId) {
  await db.collection(TASK_TABLE).where({
    _id: taskId
  }).update({
    data: {
      status: status,
    },
  })
}


async function changeCurrentLineId(currentId) {
  await db.collection('task_table').where({
    _id: task_id
  }).update({
    data: {
      current_line_id: currentId,
    },
  })
}
//没有任务的新增任务
async function addTaskLine(status, info, task_id) {
  return await db.collection('task_line').add({
    data: {
      consumers: _.push(info),
      status: status,
      task_id: task_id,

    }
  }).then(res => {
    return Promise.resolve(res._id)
  })

}

//更新taskline
async function updateTaskLine(taskLineId, info) {
  return await db.collection('task_line').where({
    _id: taskLineId
  }).update({
    data: {
      consumers: _.push(info),
    },
  })
}

//重置taskline
async function resetTaskLine(taskLineId) {
  return await db.collection('task_line').where({
    _id: taskLineId
  }).update({
    data: {
      consumers: []
    },
  })
}

/**
 * 链路数加一
 */
async function updateTaskTableAddNum(taskId) {
  return await db.collection('task_table').where({
    _id: taskId
  }).update({
    data: {
      consumed_num: _.inc(1)
    },
  })
}

async function pushMes(openid, type, data){
  await db.collection('message').add({
    openid,
    type,
    ...data
  })
}

async function getTaskPublisher(taskId){
  return (await db.collection('task_table').where({
    _id: taskId
  }).get()).data[0].publisher_id
}

/**
 * 踢人
 * 1.链路消费减法一
 * 2.更新用戶table 
 * 3.更新链路consumers-刪掉
 * 
 */
async function kickUser(kickUserId, kickTaskLine) {
  await db.collection('task_line').where({
    _id: kickTaskLine
  }).update({
    data: {
      consumers: _.pop(),
      nums: _.inc(-1)
    },
  })
  await db.collection('userinfo_table').where({
    openid: kickUserId
  }).update({
    data: {
      task_line_id: removeItem(_, kickTaskLine)
    },
  })
}

function removeItem(list, item) {
  const index = list.findIndex(function(item) {
    return item === taskLineId
  })
  list.splice(index, 1)
  return list
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
  return session_id;
}