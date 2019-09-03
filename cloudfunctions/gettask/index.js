// 云函数入口文件
const cloud = require('./node_modules/wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const openid = wxContext.OPENID
  const task = (await db.collection('task_table')
    .where({
      _id: event._id
    })
    .get()).data[0];

  if (task){
    task.joined = false;
    const users = await db.collection('userinfo_table')
      .where({
        openid: task.publisher_id
      })
      .get();
    console.log(task.publisher_id);
    console.log(users);
    if (users && users.data[0]) {
      task.user = users.data[0];
    }
  } else {
    return null;
  }

  /*
  Due to the need of the front end. Server must return a status to tell which set of button/actions should be displayed to the visitor. so, the status of the taks passed to front end is actually a computed value. And this computed value should be nerver saved into the database.
  */

  const isOwner = task.publisher_id === openid;

  if (isOwner) {
    // visitor is the owner of the task
    const lines = (await db.collection('task_line')
      .where({
        taskId: task._id
      }).get()).data;

    task.currentLines = lines;
    task.status = 'owner';
    task.position = -1;
    return task;
  } else {
    // visitor is not the owner
    const lines = (await db.collection('task_line')
      .where({
        task_id: task._id
      }).get()).data.filter(line => {
        // filte out the lines that the visitor within
        const consumers = line.consumers||[];
        return consumers.findIndex(consumer => consumer.openid === openid) >= 0;
      });
    console.info(lines);
    if (lines.length > 0) {
      // Visitor is within the lines;
      const line = lines[0];
      task.currentLines = lines;
      task.joined = true;
      task.status = line.status;
      task.position = line.consumers.findIndex(consumer => consumer.openid===openid);
      return task;
    } else if (event.link_id) {
      const toJoinLines = (await db.collection('task_line')
        .where({
          _id: event.link_id,
        }).get()).data;
        console.log(toJoinLines);
        console.log(task);
      if (toJoinLines.length > 0) {
        task.currentLines = toJoinLines;
        task.joined = false;
        task.status = toJoinLines[0].status;
        return task;
      } else {
        // Visitor is not within the lines;
        if (task.consumed_num >= 10) {
          // task chances run out.
          task.status = 'exhausted';
          task.currentLines = [];
          task.position = -1;
          return task;
        } else {
          // task still able to join.
          task.status = 'created';
          task.currentLines = [];
          task.position = -1;
          return task;
        }
      }
    }else {
      // Visitor is not within the lines;
      if (task.consumed_num >= 10) {
        // task chances run out.
        task.status = 'exhausted';
        task.currentLines = [];
        task.position = -1;
        return task;
      } else {
        // task still able to join.
        task.status = 'created';
        task.currentLines = [];
        task.position = -1;
        return task;
      }
    }
  }
}