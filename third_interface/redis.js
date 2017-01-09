var mysql = require('mysql');
var epgd = require('../epgd/insertRedisData');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制

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

function insertDefaultChannel(conn){

}

function insertChannel(channelid){
      pool.getConnection(function(err,connection){
        if(err){
          console.log('report redis insertChannel error : ' + err)
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'select channel.id, room.id from channel,channel_discount,room,room_discount where channel.id = ' + pool.escape(channelid) + ' AND channel_discount.channelId = ' + pool.escape(channelid) + ' AND room.id = channel.defaultRoom AND room_discount.roomId = channel.defaultRoom';
          console.log(sql)
          connection.query(sql, function(err, rows, fields) {
            if(err){
              console.log('report redis insertChannel error : ' + err)
            }
            else {//查询成功
              console.log(rows);
             // var channel = formatChannelInfo(rows);
             // console.log(channel)
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
  insertRoomPlayurl : insertRoomPlayurl,
  insertDefaultChannel : insertDefaultChannel,
  insertChannel : insertChannel
};


function formatChannelInfo(rows) {
  var channel = {
    id : rows[0].id,
    name : rows[0].name,
    thumb : rows[0].thumb,
    icon : rows[0].icon,
    desc : rows[0].desc,
    charge : rows[0].charge ? true : false,
    charge_strategy : getStrategy(rows),
    default_room_info : {
      id : rows[0].defaultRoom,
      name : rows[0].name1,
      thumb : rows[0].thumb1,
      desc : rows[0].desc1,
      charge : rows[0].charge1 ? true : false,
      charge_strategy : getRoomStrategy(rows),
      living : rows[0].living ? true : false,
      online : 100,
      tag : rows[0].tag,
      u3d_bg : rows[0].u3dbg,
      view_angle : rows[0].viewAngle,
      project_style : rows[0].projectStyle,
      control_model : rows[0].controlModel,
      eye_style : rows[0].eyeStyle
    }
  }
  return channel;
}

function getStrategy(rows) {
  if(!rows[0].charge){
    return {
      price : 0,
      discount : []
    };
  }
  var s = {
    price : rows[0].price,
    discount : []
  };
  var ids= [];
  for(var i = 0; i < rows.length; i++){
    if(ids.indexOf(rows[i].id1) < 0){
      s.discount.push({
        month : rows[i].amount,
        discount : rows[i].discount
      });
       ids.push(rows[i].id1);
    }
  }
  return s;
}

function getRoomStrategy(rows) {
  if(!rows[0].charge1){
    return {
      price : 0,
      discount : []
    };
  }
  var s = {
    price : rows[0].price1,
    discount : []
  };
  var ids = [];
  for(var i = 0; i < rows.length; i++){
    if(ids.indexOf(rows[i].id3) < 0){
      s.discount.push({
        month : rows[i].amount1,
        discount : rows[i].discount1
      });
       ids.push(rows[i].id3);
    }
  }
  return s;
}
