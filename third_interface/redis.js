var epgd_module = require('../epgd/redisData');
var client = require('../epgd/redisClient').redisClient;
var epgd = new epgd_module(client);
var config = require('../config/config');
var mysql = require('mysql');
var q = require('q');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制

/*通知EPG 进入APP默认播放的房间，条件为免费的频道下的免费房间*/
function insertDefaultChannel(roomid){
  getDefaultData(roomid)
    .then(function(data) {
      console.log('default report fired!');
      epgd.insertDefaultChannel(data);
    })
    .catch(function(e) {
      console.log(e)
    })
}

/*通知EPG 一个频道更新*/
function insertChannel(channelid) {
  getChannelData(channelid)
    .then(function(data) {
      console.log('channel insert fired!');
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
      console.log('channellist insert fired!');
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
          var sql = 'select channel.id,channel.name,channel.charge,channel.price,channel.icon,channel.thumb,channel.order,channel.desc,channel.defaultRoom,room.id as id2,room.name as name1,room.thumb as thumb1,room.u3dbg,room.desc as desc1,room.charge as charge1,room.tag,room.viewAngle,room.price as price1,room.controlModel,room.projectStyle,room.eyeStyle from channel,room where channel.id = ' + pool.escape(channelid) + ' AND room.id = channel.defaultRoom;';
          var sql2= 'select * from channel_discount where channel_discount.channelId = ' + pool.escape(channelid) + ';';
          var sql3 = 'select * from channel,room_discount where channel.id = ' + pool.escape(channelid) + ' and room_discount.roomId = channel.defaultRoom;';
          connection.query(sql + sql2 + sql3, function(err, result) {
            if(err){
              console.log('report redis insertChannel error : ' + err)
              defer.reject(err);
            }
            else {//查询成功
             var channel = formatChannelInfo(result[0],result[1],result[2]);
             defer.resolve(channel);
            }
            connection.release();
          });
        }
      });
      return defer.promise;
}

/*判断房间是否符合免费房间免费频道的要求*/
function getDefaultData(roomid) {
 var defer = q.defer();
      pool.getConnection(function(err,connection){
        if(err){
          console.log('report redis insertDefaultChannel error : ' + err)
          defer.reject(err);
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'select channel.id,channel.name,channel.charge,channel.price,channel.icon,channel.thumb,channel.desc,channel.defaultRoom,room.id as id1,room.name as name1,room.thumb as thumb1,room.u3dbg,room.desc as desc1,room.charge as charge1,room.price as price1,room.tag,room.viewAngle,room.controlModel,room.projectStyle,room.eyeStyle from channel,room where room.id=' + pool.escape(roomid) + ' and channel.id = room.channelId';
          connection.query(sql, function(err, rows, fields) {
            if(err){
              console.log('report redis insertDefaultChannel error : ' + err)
              defer.reject(err);
            }
            else {//查询成功
              if(rows.length == 0){
                rows[0] = {};
              }
              if(!rows[0].charge && !rows[0].charge1){
                var channel = formatDefaultChannelInfo(rows);
                defer.resolve(channel);
              } else {
                defer.reject();
              }
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
      console.log('report redis insertChannelRoomList error : ' + err);
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'SELECT id,name,thumb,room.desc,charge,living FROM room WHERE channelId = '
       + pool.escape(chid) + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log('report redis insertChannelRoomList error : ' + err);
        }
        else {
          epgd.insertChannelRoomList(chid,rows);
        }
        connection.release();
      });
    }
  });
}

function insertSwitchChannelInfo(){
  console.log(new Date().getTime());
  pool.getConnection(function(err,connection){
    if(err){
      console.log('report redis insertSwitchChannelInfo error : ' + err);
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'SELECT id,channel.order AS chorder FROM channel ORDER BY channel.order DESC,id;';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log('report redis insertSwitchChannelInfo error : ' + err);
        }
        else {
          var upid = 0,downid = 0;
          for(var i = 0;i < rows.length;i ++){
              upid = (i == 0) ? rows[rows.length - 1].id : rows[i - 1].id;
              downid = (i == rows.length - 1) ? rows[0].id : rows[i + 1].id;
              insertUpAndDown(rows[i].id,upid,downid);
          }
        }
        connection.release();
      });
    }
  });
}

function insertRoomInfo(roomId){
  pool.getConnection(function(err,connection){
    if(err){
      console.log('report redis insertRoomInfo error : ' + err);
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var r_sql = 'SELECT * FROM room WHERE id = ' + pool.escape(roomId) + ';';
      var rd_sql = 'SELECT * FROM room_discount WHERE roomId = ' + pool.escape(roomId) + ';';
      connection.query(r_sql + rd_sql, function(err, result) {
        if(err){
          console.log('report redis insertRoomInfo error : ' + err);
        }
        else {
          var roomInfo = formatRoomInfo(result[0],result[1]);
          epgd.insertRoomInfo(roomInfo);
        }
        connection.release();
      });
    }
  });
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
function formatChannelInfo(data,channelrows,roomrows) {
  var data = data[0] || {};
  var channel = {
    id : data.id,
    name : data.name,
    thumb : data.thumb,
    icon : data.icon,
    desc : data.desc,
    charge : data.charge ? true : false,
    charge_strategy : getStrategy(channelrows,data.price,data.charge),
    default_room_info : {
      id : data.defaultRoom,
      name : data.name1,
      thumb : data.thumb1,
      desc : data.desc1,
      charge : data.charge1 ? true : false,
      charge_strategy : getRoomStrategy(roomrows,data.price1,data.charge1),
      living : data.living ? true : false,
      online : 100,
      tag : data.tag,
      u3d_bg : data.u3dbg,
      view_angle : data.viewAngle,
      project_style : data.projectStyle,
      control_model : data.controlModel,
      eye_style : data.eyeStyle
    }
  }
  if(!channel.charge){
    delete channel.charge_strategy;
  }
  if(!channel.default_room_info.charge){
    delete channel.default_room_info.charge_strategy;
  }
  return channel;
}
/*拼接默认播放频道数据，与一般频道区别在于频道和默认房间都不收费*/
function formatDefaultChannelInfo(rows) {
  if(rows.length == 0){
    rows[0] ={};
  }
  var channel = {
    id : rows[0].id,
    name : rows[0].name,
    thumb : rows[0].thumb,
    icon : rows[0].icon,
    desc : rows[0].desc,
    charge : false,
    default_room_info : {
      id : rows[0].defaultRoom,
      name : rows[0].name1,
      thumb : rows[0].thumb1,
      desc : rows[0].desc1,
      charge : false,
      charge_strategy : {price : 0, discount : []},
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

function formatRoomInfo(roomRows,discountRows){
  var strategy = {
    price : 0,
    discount : []
  };
  if(roomRows[0].charge){
    strategy.price = roomRows[0].price;
    for(var i = 0; i < discountRows.length; i++){
        strategy.discount.push({
          month : discountRows[i].amount,
          discount : discountRows[i].discount
        });
    }
  }
  var roomInfo = {
    id : roomRows[0].id,
    name : roomRows[0].name,
    thumb : roomRows[0].thumb,
    desc : roomRows[0].desc,
    charge : roomRows[0].charge ? true : false,
    charge_strategy : strategy,
    living : roomRows[0].living ? true : false,
    online : 100,
    tag : roomRows[0].tag,
    u3d_bg : roomRows[0].u3dbg,
    view_angle : roomRows[0].viewAngle,
    project_style : roomRows[0].projectStyle,
    control_model : roomRows[0].controlModel,
    eye_style : roomRows[0].eyeStyle
  };
  /*不收费不需要字段，为了兼容U3D*/
  if(!roomInfo.charge){
    delete roomInfo.charge_strategy;
  }
  return roomInfo;
}

function getStrategy(rows,price,charge) {
  if(!charge){
    return {
      price : 0,
      discount : []
    };
  }
  var s = {
    price : price,
    discount : []
  };
  var ids= [];
  for(var i = 0; i < rows.length; i++){
      s.discount.push({
        month : rows[i].amount,
        discount : rows[i].discount
      });
  }
  return s;
}

function getRoomStrategy(rows,price,charge) {
  if(!charge){
    return {
      price : 0,
      discount : []
    };
  }
  var s = {
    price : price,
    discount : []
  };
  var ids = [];
  for(var i = 0; i < rows.length; i++){
      s.discount.push({
        month : rows[i].amount,
        discount : rows[i].discount
      });
  }
  return s;
}

function insertUpAndDown(selfid,upid,downid){
  getChannelData(upid)
    .then(function(up) {
      getChannelData(downid)
        .then(function(down) {
          epgd.insertSwitchChannelInfo(selfid,up,down);
        })
        .catch(function(e) {
          console.log(e)
        })
    })
    .catch(function(e) {
      console.log(e)
    })
}
