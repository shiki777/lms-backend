var q = require('q');
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var api = require('../snailcloud/api');
var Users = require('../third_interface/user');
var gift = require('../third_interface/gift');
var redis = require('../third_interface/redis');
var log4js = require('log4js');
var logger = log4js.getLogger('push_url');

function login(name,pwd){
  logger.info('login name:' + name + ' pwd:' + pwd);
  var defer = q.defer();
  if(!name || !pwd){defer.reject(new Error("login name or pwd == null"));}
  else {
    //用户系统验证用户的合法性
    Users.authentication(name,pwd)
      .then(function(resbody){
        pool.getConnection(function(err,connection){
          if(err){
      			logger.error('login pool.getConnection :' , err);
      			defer.reject(err);
          }
      		else{
      			logger.info('connected as id ' + connection.threadId);
            var sql = 'SELECT id FROM user WHERE name = ' + pool.escape(name) + ';';
      			connection.query(sql, function(err, rows, fields) {
      			  if (err) {
      					logger.error('login connection.query1 :' , err);
      					defer.reject(err);
        				connection.release();
      				}
              else if(rows.length != 1){//只会存在一个用户
                logger.error('login connection.query rows.length != 1:' , rows);
                defer.reject(new Error("login failed for not exist this user."));
        				connection.release();
              }
              else {
                var token = resbody.data.token;
                var setSql = 'INSERT INTO backinfo(id,token,status) VALUES("' + rows[0].id + '",' + pool.escape(token) + ',"1") ' +
                              'ON DUPLICATE KEY UPDATE token=VALUES(token),status=VALUES(status);';
                connection.query(setSql,function(err,result){
                  if(err){
                    logger.error('login connection.query2 :' , err);
                    defer.reject(err);
                  }
                  else {
                    logger.info("login name:" + name + " token:" + token);
                    defer.resolve(token);
                  }
          				connection.release();
                });
              }
      			});
          }
        });
      })
      .catch(function(errmsg){
        logger.error('login Users.authentication err:' + errmsg);
        defer.reject(new Error(errmsg));
      })
  }
  return defer.promise;
}

function logout(token){
  logger.info("logout token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("logout failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        logger.error('logout pool.getConnection :' , err);
  			defer.reject(err);
      }
      else {
        logger.info('connected as id ' + connection.threadId);
        var sql = 'UPDATE backinfo SET token = null,status = 0 WHERE token = ' + pool.escape(token) + ';';
        connection.query(sql,function(err,result){
          if(err){
            logger.error('logout connection.query :' , err);
            defer.reject(err);
          }
          else if(result.affectedRows == 1){
            logger.info("logout success.");
            defer.resolve(null);//登出成功
          }
          else {//登出失败
            logger.error('logout err result.affectedRows != 1 :' , result);
            defer.reject(new Error("logout failed for not unique or not exist or wrong token."));
          }
  				connection.release();
        });
      }
    });
  }
  return defer.promise;
}

function getPushUrl(token){
  logger.info("getPushUrl token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getPushUrl failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        logger.error('getPushUrl pool.getConnection :' , err);
  			defer.reject(err);
      }
      else {
        logger.info('connected as id ' + connection.threadId);
  			//匹配该用户是否已经登录是否有权限并获取房间推流地址pushUrl
        var sql = 'SELECT pushUrl FROM backinfo,room_user,room WHERE token = ' +
        pool.escape(token) + ' AND status = 1 AND backinfo.id = userId AND roomId = room.id;' ;
        connection.query(sql, function(err, rows, fields) {
          if(err){
            logger.error('getPushUrl connection.query :' , err);
            defer.reject(err);
          }
          else if(rows.length != 1){
            logger.error('getPushUrl err rows.length != 1 :' , rows);
            defer.reject(new Error("getPushUrl failed for not exist user or not login or wrong token."));
          }
          else {
            var pushurl = api.getRoomPushUrl(rows[0].pushUrl);
            logger.info(pushurl);
            defer.resolve(pushurl);
          }
          connection.release();
        });
      }
    });
  }
  return defer.promise;
}

function getUserInfo(token){
  logger.info("getUserInfo token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getUserInfo failed for token == null."));}
  else {
    Users.userinfo(token)
      .then(function(resbody){
        logger.info('getUserInfo Users.userinfo:' , resbody);
        defer.resolve({nickname:resbody.data.nickname,headicon:resbody.data.head_icon});
      })
      .catch(function(errmsg){
        logger.error('getUserInfo Users.userinfo err :' + errmsg);
        defer.reject(new Error(errmsg));
      })
  }
  return defer.promise;
}

function getRoomInfo(token){
  logger.info("getRoomInfo token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getRoomInfo failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        logger.error('getRoomInfo pool.getConnection :' , err);
  			defer.reject(err);
      }
      else {
        logger.info('connected as id ' + connection.threadId);
        var sql = 'SELECT room.id AS room_id,room.name AS room_name,channel.name AS channel_name,living AS play_status' +
        ' FROM backinfo,room_user,room,channel WHERE token = ' + pool.escape(token) +
        ' AND status = 1 AND backinfo.id = userId AND roomId = room.id AND room.channelId = channel.id;';
        connection.query(sql, function(err, rows, fields) {
          if(err){
            logger.error('getRoomInfo connection.query :' , err);
            defer.reject(err);
          }
          else if(rows.length != 1){
            logger.error('getRoomInfo err rows.length != 1 :' , rows);
            defer.reject(new Error("getRoomInfo failed for not exist user or not login or wrong token."));
          }
          else {
            //目前没有提供人气及观众数的接口，暂时写死，后续与云平台对接
            rows[0].ninki = 100;
            rows[0].audience_count = 1000;
            logger.info('getRoomInfo success :',rows[0]);
            defer.resolve(rows[0]);
          }
          connection.release();
        });
      }
    });
  }
  return defer.promise;
}

function getChatInfo(token){
  logger.info("getChatInfo token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getChatInfo failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        logger.error('getChatInfo pool.getConnection :' , err);
  			defer.reject(err);
      }
      else {
        logger.info('connected as id ' + connection.threadId);
        var sql = 'SELECT roomId FROM room_user WHERE userId IN(' +
                    'SELECT id FROM backinfo WHERE token = ' + pool.escape(token) + ' AND status = 1);';
        connection.query(sql, function(err, rows, fields) {
          if(err){
            logger.error('getChatInfo connection.query :' , err);
            defer.reject(err);
          }
          else if(rows.length != 1){
            logger.error('getChatInfo err rows.length != 1 :' , rows);
            defer.reject(new Error("getChatInfo failed for not exist user or not login or wrong token."));
          }
          else {
            var data = {
              chat_id : rows[0].roomId,
              host : config.chatroom.host,
              port : config.chatroom.port
            };
            logger.info('getChatInfo success:',data);
            defer.resolve(data);
          }
          connection.release();
        });
      }
    });
  }
  return defer.promise;
}

function setVRDomeScreenSize(token,dome_horizontal,dome_vertical){
  logger.info("setVRDomeScreenSize token:" + token + ' dome_horizontal:' + dome_horizontal + ' dome_vertical:' + dome_vertical);
  var defer = q.defer();
  if(!token){defer.reject(new Error("setVRDomeScreenSize failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        logger.error('setVRDomeScreenSize pool.getConnection :' , err);
  			defer.reject(err);
      }
      else {
        logger.info('connected as id ' + connection.threadId);
        var sql = 'SELECT id AS roomId,channelId FROM room WHERE id IN(SELECT roomId FROM room_user WHERE userId IN(SELECT id FROM backinfo WHERE token = ' + pool.escape(token) + '));';
        var setSql = 'UPDATE room SET domeHorizontal = ' + pool.escape(dome_horizontal) + ',domeVertical = ' + pool.escape(dome_vertical) +
        ' WHERE id IN(SELECT roomId FROM room_user WHERE userId IN(SELECT id FROM backinfo WHERE token = ' + pool.escape(token) + '));';
        connection.query(sql + setSql, function(err, result) {
          if(err){
            logger.error('setVRDomeScreenSize connection.query err:' , err);
            defer.reject(err);
          }
          else if(result[1].affectedRows != 1){
            logger.error('setVRDomeScreenSize err result[1].affectedRows != 1 :' , result[1]);
            defer.reject(new Error("setVRDomeScreenSize failed for update room set wrong."));
          }
          else {
            //redis操作
            redis.insertDefaultChannel(result[0][0].roomId);
            redis.insertChannel(result[0][0].channelId);
            redis.insertSwitchChannelInfo();
            redis.insertRoomInfo(result[0][0].roomId);

            logger.info('setVRDomeScreenSize success.');
            defer.resolve("setVRDomeScreenSize success.");
          }
          connection.release();
        });
      }
    });
  }
  return defer.promise;
}

function startPushStream(token){
  logger.info("startPushStream token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("startPushStream failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        logger.error('startPushStream pool.getConnection :' , err);
  			defer.reject(err);
      }
      else {
        logger.info('connected as id ' + connection.threadId);
        var sql = 'SELECT user.id AS id,uid,user.name,roomId,channelId FROM backinfo,user,room_user,room WHERE token = '
        + pool.escape(token) + ' AND status = 1 AND user.id = backinfo.id AND userId = user.id AND room.id = roomId;';
        connection.query(sql, function(err, rows, fields) {
          if(err){
            logger.error('startPushStream connection.query1 :' , err);
            defer.reject(err);
            connection.release();
          }
          else if(rows.length != 1){
            logger.error('startPushStream err rows.length != 1 :' , rows);
            defer.reject(new Error("startPushStream failed for not exist user or not login or wrong token."));
            connection.release();
          }
          else {
            var setSql = 'UPDATE room SET host = ' + rows[0].id + ',hostName = ' + pool.escape(rows[0].name) + ',living = 1 WHERE id = ' + rows[0].roomId + ';';
            connection.query(setSql, function(err, result) {
              if(err){
                logger.error('startPushStream connection.query2 :' , err);
                defer.reject(err);
              }
              else if(result.affectedRows != 1){
                logger.error('startPushStream err result.affectedRows != 1 :' , result);
                defer.reject(new Error("startPushStream failed for update room set wrong."));
              }
              else {
                logger.info('startPushStream success then send msg to gift sys and write redis.',rows[0]);
                defer.resolve("startPushStream success.");
                //通知礼物系统
                gift.room_play_stop(rows[0].roomId,rows[0].uid,true)
                  .then(function(resbody){
                    logger.info("gift startPushStream res msg:", resbody);
                  })
                  .catch(function(errmsg){
                    logger.error("gift startPushStream res msg:" + errmsg);
                  });
                redis.insertRoomInfo(rows[0].roomId);
                redis.insertChannelRoomList(rows[0].channelId);
                redis.insertSwitchChannelInfo();
                redis.insertChannel(rows[0].channelId);
              }
              connection.release();
            });
          }
        });
      }
    });
  }
  return defer.promise;
}

function stopPushStream(token){
  logger.info("stopPushStream token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("stopPushStream failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        logger.error('stopPushStream pool.getConnection :' , err);
  			defer.reject(err);
      }
      else {
        logger.info('connected as id ' + connection.threadId);
        var sql = 'SELECT uid,roomId,channelId FROM backinfo,user,room_user,room WHERE token = '
        + pool.escape(token) + ' AND status = 1 AND backinfo.id = user.id AND userId = backinfo.id AND room.id = roomId;';
        connection.query(sql, function(err,rows,fields) {
          if(err){
            logger.error('stopPushStream connection.query1 :' , err);
            defer.reject(err);
            connection.release();
          }
          else if(rows.length != 1){
            logger.error('stopPushStream err rows.length != 1 :' , rows);
            defer.reject(new Error("stopPushStream failed for not exist user or not login or wrong token."));
            connection.release();
          }
          else {
            var setSql = 'UPDATE room SET host = null,hostName = null,living = 0 WHERE id = ' + rows[0].roomId + ';';
            connection.query(setSql, function(err,result) {
              if(err){
                logger.error('stopPushStream connection.query2 :' , err);
                defer.reject(err);
              }
              else if(result.affectedRows != 1){
                logger.error('stopPushStream err result.affectedRows != 1 :' , result);
                defer.reject(new Error("stopPushStream failed for update room wrong."));
              }
              else {
                logger.info('stopPushStream success then send msg to gift sys and write redis.',rows[0]);
                defer.resolve("stopPushStream success.");
                //通知礼物系统
                gift.room_play_stop(rows[0].roomId,rows[0].uid,false)
                  .then(function(resbody){
                    logger.info("gift stopPushStream res msg:" , resbody);
                  })
                  .catch(function(errmsg){
                    logger.error("gift stopPushStream res msg:" + errmsg);
                  });
                redis.insertRoomInfo(rows[0].roomId);
                redis.insertChannelRoomList(rows[0].channelId);
                redis.insertSwitchChannelInfo();
                redis.insertChannel(rows[0].channelId);
              }
              connection.release();
            });
          }
        });
      }
    });
  }
  return defer.promise;
}

module.exports = {
  login  : login,
  logout : logout,
  getPushUrl : getPushUrl,
  getUserInfo : getUserInfo,
  getRoomInfo : getRoomInfo,
  getChatInfo : getChatInfo,
  setVRDomeScreenSize : setVRDomeScreenSize,
  startPushStream : startPushStream,
  stopPushStream : stopPushStream
};
