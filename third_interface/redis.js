var epgd_module = require('../epgd/redisData');
var client = require('../epgd/redisClient').redisClient;
var epgd = new epgd_module(client);
var config = require('../config/config');
var mysql = require('mysql');
var q = require('q');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var log4js = require('log4js');
var logger = log4js.getLogger('redis_sys');

/*通知EPG 进入APP默认播放的房间，条件为免费的频道下的免费房间*/
function insertDefaultChannel(roomid){
  logger.info('insertDefaultChannel roomid :' + roomid);
  getDefaultData(roomid)
    .then(function(data) {
      logger.info('insertDefaultChannel report fired:',data);
      epgd.insertDefaultChannel(data);
    })
    .catch(function(e) {
      logger.error('insertDefaultChannel err',e);
    })
}

/*通知EPG 一个频道更新*/
function insertChannel(channelid) {
  logger.info('insertChannel channelid :' + channelid);
  getChannelData(channelid)
    .then(function(data) {
      logger.info('insertChannel insert fired:',data);
      epgd.insertChannelInfo(data);
    })
    .catch(function(e) {
      logger.error('insertChannel err',e);
    })
}

/*通知EPG 频道列表更新*/
function insertChannelList(channelid) {
  logger.info('insertChannelList channelid :' + channelid);
  getChannelListData(channelid)
    .then(function(data) {
      logger.info('insertChannelList insert fired:',data);
      epgd.insertChannelList(data);
    })
    .catch(function(e) {
      logger.error('insertChannelList err',e);
    })
}

/*拿符合redis格式的一个频道数据*/
function getChannelData(channelid){
  logger.info('getChannelData channelid :' + channelid);
  var defer = q.defer();
      pool.getConnection(function(err,connection){
        if(err){
          logger.error('getChannelData pool.getConnection error :',err);
          defer.reject(err);
        }
        else {
          logger.info('connected as id ' + connection.threadId);
          var sql = 'select channel.id,channel.name,channel.charge,channel.price,channel.icon,channel.thumb,channel.order,channel.desc,channel.defaultRoom,room.id as id2,room.name as name1,room.thumb as thumb1,room.u3dbg,room.desc as desc1,room.charge as charge1,room.tag,room.viewAngle,room.price as price1,room.controlModel,room.projectStyle,room.eyeStyle,domeHorizontal,domeVertical from channel,room where channel.id = ' + pool.escape(channelid) + ' AND room.id = channel.defaultRoom;';
          var sql2= 'select * from channel_discount where channel_discount.channelId = ' + pool.escape(channelid) + ';';
          var sql3 = 'select * from channel,room_discount where channel.id = ' + pool.escape(channelid) + ' and room_discount.roomId = channel.defaultRoom;';
          connection.query(sql + sql2 + sql3, function(err, result) {
            if(err){
              logger.error('getChannelData connection.query error :',err);
              defer.reject(err);
            }
            else {//查询成功
             var channel = formatChannelInfo(result[0],result[1],result[2]);
             logger.info('getChannelData success',channel);
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
  logger.info('getDefaultData roomid :' + roomid);
 var defer = q.defer();
      pool.getConnection(function(err,connection){
        if(err){
          logger.error('getDefaultData pool.getConnection error :',err);
          defer.reject(err);
        }
        else {
          logger.info('connected as id ' + connection.threadId);
          var sql = 'select channel.id,channel.name,channel.charge,channel.price,channel.icon,channel.thumb,channel.desc,channel.defaultRoom,room.id as id1,room.name as name1,room.thumb as thumb1,room.u3dbg,room.desc as desc1,room.charge as charge1,room.price as price1,room.tag,room.viewAngle,room.controlModel,room.projectStyle,room.eyeStyle,domeHorizontal,domeVertical from channel,room where room.id=' + pool.escape(roomid) + ' and channel.id = room.channelId';
          connection.query(sql, function(err, rows, fields) {
            if(err){
              logger.error('getDefaultData connection.query error :',err);
              defer.reject(err);
            }
            else {//查询成功
              if(rows.length == 0){
                rows[0] = {};
              }
              if(!rows[0].charge && !rows[0].charge1){
                var channel = formatDefaultChannelInfo(rows,roomid);
                logger.info('getDefaultData success:',channel);
                defer.resolve(channel);
              } else {
                logger.error('getDefaultData !rows[0].charge && !rows[0].charge1:',rows[0]);
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
  logger.info('getChannelListData enter.');
 var defer = q.defer();
      pool.getConnection(function(err,connection){
        if(err){
          logger.error('getChannelListData pool.getConnection error :',err);
          defer.reject(err);
        }
        else {
          logger.info('connected as id ' + connection.threadId);
          var sql = 'select * from channel';
          connection.query(sql, function(err, rows, fields) {
            if(err){
              logger.error('getChannelListData connection.query error :',err);
              defer.reject(err);
            }
            else {//查询成功
             var list = formatChannelList(rows);
             logger.info('getChannelListData success:',list);
             defer.resolve(list);
            }
            connection.release();
          });
        }
      });
      return defer.promise;
}

function insertChannelRoomList(chid){
  logger.info('insertChannelRoomList chid:' + chid);
  if(!chid && parseInt(chid) != 0){return logger.info('report redis insertChannelRoomList error : chid == null');}
  pool.getConnection(function(err,connection){
    if(err){
      logger.error('insertChannelRoomList pool.getConnection error :',err);
    }
    else {
      logger.info('connected as id ' + connection.threadId);
      var sql = 'SELECT id,name,thumb,room.desc,charge,living,tag FROM room WHERE channelId = '
       + pool.escape(chid) + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          logger.error('insertChannelRoomList connection.query error :',err);
        }
        else {
          var result = formatChannelRoomList(rows);
          logger.info('insertChannelRoomList success chid:' + chid + ' list:',result);
          epgd.insertChannelRoomList(parseInt(chid),result);
        }
        connection.release();
      });
    }
  });
}

function insertSwitchChannelInfo(){
  logger.info('insertSwitchChannelInfo enter.');
  pool.getConnection(function(err,connection){
    if(err){
      logger.error('insertSwitchChannelInfo pool.getConnection error :',err);
    }
    else {
      logger.info('connected as id ' + connection.threadId);
      var sql = 'SELECT id,channel.order AS chorder FROM channel WHERE defaultRoom IS NOT NULL ORDER BY channel.order DESC,id;';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          logger.error('insertSwitchChannelInfo connection.query error :',err);
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
  logger.info('insertRoomInfo roomId:' + roomId);
  if(!roomId && parseInt(roomId) != 0){return logger.info('report redis insertRoomInfo error : roomId == null');}
  pool.getConnection(function(err,connection){
    if(err){
      logger.error('insertRoomInfo pool.getConnection error :',err);
    }
    else {
      logger.info('connected as id ' + connection.threadId);
      var r_sql = 'SELECT * FROM room WHERE id = ' + pool.escape(roomId) + ';';
      var rd_sql = 'SELECT * FROM room_discount WHERE roomId = ' + pool.escape(roomId) + ';';
      connection.query(r_sql + rd_sql, function(err, result) {
        if(err){
          logger.error('insertRoomInfo connection.query error :',err);
        }
        else {
          var roomInfo = formatRoomInfo(result[0],result[1]);
          logger.info('insertRoomInfo success ' , roomInfo);
          epgd.insertRoomInfo(roomInfo);
        }
        connection.release();
      });
    }
  });
}

function insertRoomPlayurl(roomId,playUrl){
  logger.info('insertRoomPlayurl roomId:' + roomId + ' playUrl:' + playUrl);
  if((!roomId && parseInt(roomId) != 0) || !playUrl){return logger.info('report redis insertRoomPlayurl error : roomId == null || playUrl == null');}
  epgd.insertRoomPlayurl(parseInt(roomId),playUrl);
}

function deleteRoom(roomId){
  logger.info('deleteRoom roomId:' + roomId);
  if(!roomId && parseInt(roomId) != 0){return console.log('report redis deleteRoom error : roomId == null');}
  epgd.delRoom(parseInt(roomId));
}

function deleteChannel(chid){
  logger.info('deleteChannel chid:' + chid);
  if(!chid && parseInt(chid) != 0){return console.log('report redis deleteChannel error : chid == null');}
  epgd.delChannel(parseInt(chid));
}

function deleteAllData(){
  logger.info('deleteAllData enter.');
  epgd.delAll();
}

/*拼接频道列表数据*/
function formatChannelList(rows) {
  logger.trace('formatChannelList enter rows:',rows);
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
  logger.trace('formatChannelList rtn list:',list);
  return list;
}

/*拼接频道数据*/
function formatChannelInfo(data,channelrows,roomrows) {
  logger.trace('formatChannelInfo enter:',data,channelrows,roomrows);
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
      eye_style : data.eyeStyle,
      dome_horizontal : data.domeHorizontal,
      dome_vertical : data.domeVertical
    }
  }
  if(!channel.charge){
    delete channel.charge_strategy;
  }
  if(!channel.default_room_info.charge){
    delete channel.default_room_info.charge_strategy;
  }
  logger.trace('formatChannelInfo rtn channel:',channel);
  return channel;
}
/*拼接默认播放频道数据，与一般频道区别在于频道和默认房间都不收费*/
function formatDefaultChannelInfo(rows,roomid) {
  logger.trace('formatDefaultChannelInfo enter rows:',rows);
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
      id : roomid,
      name : rows[0].name1,
      thumb : rows[0].thumb1,
      desc : rows[0].desc1,
      charge : false,
      living : rows[0].living ? true : false,
      online : 100,
      tag : rows[0].tag,
      u3d_bg : rows[0].u3dbg,
      view_angle : rows[0].viewAngle,
      project_style : rows[0].projectStyle,
      control_model : rows[0].controlModel,
      eye_style : rows[0].eyeStyle,
      dome_horizontal : rows[0].domeHorizontal,
      dome_vertical : rows[0].domeVertical
    }
  }
  logger.trace('formatDefaultChannelInfo rtn channel:',channel);
  return channel;
}

function formatChannelRoomList(rows) {
  logger.trace('formatChannelRoomList enter rows:',rows);
  var res = [];
  for(var i = 0; i < rows.length; i++){
    res.push({
      id: rows[i].id, //Number 房间id，标识符
      name: rows[i].name, //String 房间名
      thumb: rows[i].thumb, //String 房间封面
      desc: rows[i].desc, //String 房间简介
      charge: rows[i].charge ? true : false, //Boolean 房间是否（独立）收费
      living: rows[i].living ? true : false, //Boolean 房间是否在直播
      tag :  rows[i].tag
    });
  }
  logger.trace('formatChannelRoomList rtn list:',res);
  return res;
}

function formatRoomInfo(roomRows,discountRows){
  logger.trace('formatRoomInfo enter:',roomRows,discountRows);
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
    eye_style : roomRows[0].eyeStyle,
    dome_horizontal : roomRows[0].domeHorizontal,
    dome_vertical : roomRows[0].domeVertical
  };
  /*不收费不需要字段，为了兼容U3D*/
  if(!roomInfo.charge){
    delete roomInfo.charge_strategy;
  }
  logger.trace('formatRoomInfo rtn:',roomInfo);
  return roomInfo;
}

function getStrategy(rows,price,charge) {
  logger.trace('getStrategy enter price:' + price + ' charge:' + charge,rows)
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
  logger.trace('getStrategy rtn:',s);
  return s;
}

function getRoomStrategy(rows,price,charge) {
  logger.trace('getRoomStrategy enter price:' + price + ' charge:' + charge,rows)
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
  logger.trace('getRoomStrategy rtn:',s);
  return s;
}

function insertUpAndDown(selfid,upid,downid){
  getChannelData(upid)
    .then(function(up) {
      getChannelData(downid)
        .then(function(down) {
          logger.info('insertUpAndDown epgd.insertSwitchChannelInfo chid :' + selfid,up,down);
          epgd.insertSwitchChannelInfo(parseInt(selfid),up,down);
        })
        .catch(function(e) {
          logger.info('insertUpAndDown getChannelData2 err chid:' + selfid,e);
        })
    })
    .catch(function(e) {
      logger.info('insertUpAndDown getChannelData1 err chid:' + selfid,e);
    })
}

module.exports = {
  insertDefaultChannel : insertDefaultChannel,
  insertChannel : insertChannel,
  insertChannelList : insertChannelList,
  insertChannelRoomList : insertChannelRoomList,
  insertSwitchChannelInfo : insertSwitchChannelInfo,
  insertRoomInfo : insertRoomInfo,
  insertRoomPlayurl : insertRoomPlayurl,
  deleteRoom : deleteRoom,
  deleteChannel : deleteChannel,
  deleteAllData : deleteAllData
};