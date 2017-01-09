var epgd = require('../epgd/insertRedisData');
var config = require('../config/config');
var mysql = require('mysql');
var q = require('q');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制

function insertDefaultChannel(conn){

}

/*通知EPG 一个频道更新*/
function insertChannel(channelid) {
  getChannelData(channelid)
    .then(function(data) {
      epgd.insertChannelInfo(data);
    })
    .catch(function(e) {
      console.log(e)
    })
}

/*通知EPG 频道列表更新*/
function insertChannelList(channelid) {
  getChannelListData(channelid)
    .then(function(data) {
      console.log(data)
      epgd.insertChannelList(data);
    })
    .catch(function(e) {
      console.log(e)
    })
}

/*拿符合redis格式的一个频道数据*/
function getChannelData(channelid){
 var defer = q.defer();
      pool.getConnection(function(err,connection){
        if(err){
          console.log('report redis insertChannel error : ' + err)
          defer.reject(err);
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'select channel.id,channel.name,channel.charge,channel.price,channel.icon,channel.thumb,channel.order,channel.desc,channel.defaultRoom,channel_discount.id as id1,channel_discount.amount,channel_discount.discount,room.id as id2,room.name as name1,room.thumb as thumb1,room.u3dbg,room.desc as desc1,room.charge as charge1,room.tag,room.viewAngle,room.price as price1,room.controlModel,room.projectStyle,room.eyeStyle,room_discount.id as id3,room_discount.roomId,room_discount.amount as amount1,room_discount.discount as discount1 from channel,channel_discount,room,room_discount where channel.id = ' + pool.escape(channelid) + ' AND channel_discount.channelId = ' + pool.escape(channelid) + ' AND room.id = channel.defaultRoom AND room_discount.roomId = channel.defaultRoom';
          connection.query(sql, function(err, rows, fields) {
            if(err){
              console.log('report redis insertChannel error : ' + err)
              defer.reject(err);
            }
            else {//查询成功
             var channel = formatChannelInfo(rows);
             defer.resolve(channel);
            }
            connection.release();
          });
        }
      });
      return defer.promise;
}

/*获取频道列表接口*/
function getChannelListData() {
 var defer = q.defer();
      pool.getConnection(function(err,connection){
        if(err){
          console.log('report redis insertChannelList error : ' + err)
          defer.reject(err);
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'select * from channel';
          connection.query(sql, function(err, rows, fields) {
            if(err){
              console.log('report redis insertChannelList error : ' + err)
              defer.reject(err);
            }
            else {//查询成功
             var list = formatChannelList(rows);
             defer.resolve(list);
            }
            connection.release();
          });
        }
      });
      return defer.promise;
}

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
      var sql = 'SELECT * FROM channel ORDER BY channel.order,id';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
        }
        else {
          var upid = 0,downid = 0;
          for(var i = 0;i < rows.length;i ++){
            if(rows[i].id == chid){
              upid = (i == 0) ? rows[rows.length - 1].id : rows[i - 1].id;
              downid = (i == rows.length - 1) ? rows[0].id : rows[i + 1].id;
              break;
            }
          }
          getChannelData(upid)
            .then(function(up) {
              getChannelData(downid)
                .then(function(down) {
                  epgd.insertSwitchChannelInfo(chid,up,down);
                })
                .catch(function(e) {
                  console.log(e)
                })
            })
            .catch(function(e) {
              console.log(e)
            })
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

module.exports = {
  insertDefaultChannel : insertDefaultChannel,
  insertChannel : insertChannel,
  insertChannelList : insertChannelList,
  insertChannelRoomList : insertChannelRoomList,
  insertSwitchChannelInfo : insertSwitchChannelInfo,
  insertRoomInfo : insertRoomInfo,
  insertRoomPlayurl : insertRoomPlayurl
};

/*拼接频道列表数据*/
function formatChannelList(rows) {
  if(rows.length == 0){
    rows[0] ={};
  }
  var list = [];
  for(var i = 0; i < rows.length; i++){
    list.push({
      id : rows[i].id,
      name : rows[i].name,
      thumb : rows[i].thumb,
      default_room_info : {
        id : rows[i].defaultRoom
      }
    })
  }
  return list;
}

/*拼接频道数据*/
function formatChannelInfo(rows) {
  if(rows.length == 0){
    rows[0] ={};
  }
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
