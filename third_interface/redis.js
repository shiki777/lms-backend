var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);
var epgd = require('../epgd/insertRedisData');

function insertChannelRoomList(chid){
  if(!chid){return;}
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
    }
    else {
      var sql = 'SELECT id,name,thumb,room.desc,charge,living FROM room WHERE channelId = '
       + pool.escape(chid) + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
        }
        else {
          epgd.insertChannelRoomList(chid,rows);
        }
        connection.release();
      });
    }
  });
}

function insertSwitchChannelInfo(chid){
  if(!chid){return;}
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
    }
    else {
      var sql = 'SELECT * FROM channel,room WHERE room.id = channel.defaultRoom ORDER BY channel.order,channel.id;';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
        }
        else {
          console.log(rows);
          /*for(var i = 0;i < rows.length;i ++){

          }
          epgd.insertSwitchChannelInfo(chid,);*/
        }
        connection.release();
      });
    }
  });
}

function insertRoomInfo(roomId,body){
  if(!roomId || !body){return;}
  var roominfo = {
    id : roomId,
    name : body.name,
    thumb : body.thumb,
    desc : body.desc,
    charge : body.charge,
    charge_strategy : body.chargeStrategy,
    living : body.living,
    online : 100,
    tag : body.tag,
    u3d_bg : body.u3dbg,
    view_angle : body.viewAngle,
    project_style : body.projectStyle,
    control_model : body.controlModel,
    eye_style : body.eyeStyle
  }
  epgd.insertRoomInfo(roominfo);
}

function insertRoomPlayurl(roomId,playUrl){
  if(!roomId || !playUrl){return;}
  epgd.insertRoomPlayurl(roomId,playUrl);
}

function makeChannel(data){
  if(!data){return null;}
  return {

  };
}

module.exports = {
  insertChannelRoomList : insertChannelRoomList,
  insertSwitchChannelInfo : insertSwitchChannelInfo,
  insertRoomInfo : insertRoomInfo,
  insertRoomPlayurl : insertRoomPlayurl
};
