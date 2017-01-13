var q = require('q');
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var api = require('../snailcloud/api');
var Users = require('../third_interface/user');
var gift = require('../third_interface/gift');
var redis = require('../third_interface/redis');

function login(name,pwd){
  var defer = q.defer();
  if(!name || !pwd){defer.reject(new Error("login name or pwd == null"));}
  else {
    //用户系统验证用户的合法性
    Users.authentication(name,pwd)
      .then(function(resbody){
        pool.getConnection(function(err,connection){
          if(err){
      			console.log(err);
      			defer.reject(err);
          }
      		else{
      			console.log('connected as id ' + connection.threadId);
            var sql = 'SELECT id FROM user WHERE name = ' + pool.escape(name) + ';';
      			connection.query(sql, function(err, rows, fields) {
      			  if (err) {
      					console.log(err);
      					defer.reject(err);
        				connection.release();
      				}
              else if(rows.length != 1){//只会存在一个用户
                defer.reject(new Error("login failed for not exist this user."));
        				connection.release();
              }
              else {
                var token = resbody.data.token;
                var setSql = 'INSERT INTO backinfo(id,token,status) VALUES("' + rows[0].id + '",' + pool.escape(token) + ',"1") ' +
                              'ON DUPLICATE KEY UPDATE token=VALUES(token),status=VALUES(status);';
                connection.query(setSql,function(err,result){
                  if(err){
                    console.log(err);
                    defer.reject(err);
                  }
                  else {
                    console.log("SDK login name:" + name + " token:" + token);
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
        defer.reject(errmsg);
      })
  }
  return defer.promise;
}

function logout(token){
  console.log("SDK logout token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("logout failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        console.log(err);
  			defer.reject(err);
      }
      else {
        console.log('connected as id ' + connection.threadId);
        var sql = 'UPDATE backinfo SET token = null,status = 0 WHERE token = ' + pool.escape(token) + ';';
        connection.query(sql,function(err,result){
          if(err){
            console.log(err);
            defer.reject(err);
          }
          else if(result.affectedRows == 1){
            defer.resolve(null);//登出成功
          }
          else {//登出失败
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
  console.log("SDK getPushUrl token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getPushUrl failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        console.log(err);
  			defer.reject(err);
      }
      else {
        console.log('connected as id ' + connection.threadId);
  			//匹配该用户是否已经登录是否有权限并获取房间推流地址pushUrl
        var sql = 'SELECT pushUrl FROM backinfo,room_user,room WHERE token = ' +
        pool.escape(token) + ' AND status = 1 AND backinfo.id = userId AND roomId = room.id;' ;
        connection.query(sql, function(err, rows, fields) {
          if(err){
            console.log(err);
            defer.reject(err);
          }
          else if(rows.length != 1){
            defer.reject(new Error("getPushUrl failed for not exist user or not login or wrong token."));
          }
          else {
            var pushurl = api.getRoomPushUrl(rows[0].pushUrl);
            console.log(pushurl);
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
  console.log("SDK getUserInfo token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getUserInfo failed for token == null."));}
  else {
    Users.userinfo(token)
      .then(function(resbody){
        defer.resolve({nickname:resbody.data.nickname,headicon:resbody.data.head_icon});
      })
      .catch(function(errmsg){
        defer.reject(errmsg);
      })
  }
  return defer.promise;
}

function getRoomInfo(token){
  console.log("SDK getRoomInfo token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getRoomInfo failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        console.log(err);
  			defer.reject(err);
      }
      else {
        console.log('connected as id ' + connection.threadId);
        var sql = 'SELECT room.id AS room_id,room.name AS room_name,channel.name AS channel_name,living AS play_status' +
        ' FROM backinfo,room_user,room,channel WHERE token = ' + pool.escape(token) +
        ' AND status = 1 AND backinfo.id = userId AND roomId = room.id AND room.channelId = channel.id;';
        connection.query(sql, function(err, rows, fields) {
          if(err){
            console.log(err);
            defer.reject(err);
          }
          else if(rows.length != 1){
            defer.reject(new Error("getRoomInfo failed for not exist user or not login or wrong token."));
          }
          else {
            //目前没有提供人气及观众数的接口，暂时写死，后续与云平台对接
            rows[0].ninki = 100;
            rows[0].audience_count = 1000;
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
  console.log("SDK getChatInfo token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("getChatInfo failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        console.log(err);
  			defer.reject(err);
      }
      else {
        console.log('connected as id ' + connection.threadId);
        var sql = 'SELECT roomId FROM room_user WHERE userId IN(' +
                    'SELECT id FROM backinfo WHERE token = ' + pool.escape(token) + ' AND status = 1);';
        connection.query(sql, function(err, rows, fields) {
          if(err){
            console.log(err);
            defer.reject(err);
          }
          else if(rows.length != 1){
            defer.reject(new Error("getChatInfo failed for not exist user or not login or wrong token."));
          }
          else {
            var data = {
              chat_id : rows[0].roomId,
              host : config.chatroom.host,
              port : config.chatroom.port
            };
            defer.resolve(data);
          }
          connection.release();
        });
      }
    });
  }
  return defer.promise;
}

function startPushStream(token){
  var defer = q.defer();
  if(!token){defer.reject(new Error("startPushStream failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        console.log(err);
  			defer.reject(err);
      }
      else {
        console.log('connected as id ' + connection.threadId);
        var sql = 'SELECT user.id AS id,uid,user.name,roomId,channelId FROM backinfo,user,room_user,room WHERE token = '
        + pool.escape(token) + ' AND status = 1 AND user.id = backinfo.id AND userId = user.id AND room.id = roomId;';
        connection.query(sql, function(err, rows, fields) {
          if(err){
            console.log(err);
            defer.reject(err);
            connection.release();
          }
          else if(rows.length != 1){
            defer.reject(new Error("startPushStream failed for not exist user or not login or wrong token."));
            connection.release();
          }
          else {
            var setSql = 'UPDATE room SET host = ' + rows[0].id + ',hostName = ' + pool.escape(rows[0].name) + ',living = 1 WHERE id = ' + rows[0].roomId + ';';
            connection.query(setSql, function(err, result) {
              if(err){
                console.log(err);
                defer.reject(err);
              }
              else if(result.affectedRows != 1){
                defer.reject(new Error("startPushStream failed for update room set wrong."));
              }
              else {
                defer.resolve("startPushStream success.");
                //通知礼物系统
                console.log('SDK startPushStream send to gift roomid : ' + rows[0].roomId + ' uid : ' + rows[0].uid);
                gift.room_play_stop(rows[0].roomId,rows[0].uid,true)
                  .then(function(resbody){
                    console.log("gift startPushStream res msg:" + resbody);
                  })
                  .catch(function(errmsg){
                    console.log("gift startPushStream res msg:" + errmsg);
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
  console.log("SDK stopPushStream token:" + token);
  var defer = q.defer();
  if(!token){defer.reject(new Error("stopPushStream failed for token == null."));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
        console.log(err);
  			defer.reject(err);
      }
      else {
        console.log('connected as id ' + connection.threadId);
        var sql = 'SELECT uid,roomId,channelId FROM backinfo,user,room_user,room WHERE token = '
        + pool.escape(token) + ' AND status = 1 AND backinfo.id = user.id AND userId = backinfo.id AND room.id = roomId;';
        connection.query(sql, function(err,rows,fields) {
          if(err){
            console.log(err);
            defer.reject(err);
            connection.release();
          }
          else if(rows.length != 1){
            defer.reject(new Error("stopPushStream failed for not exist user or not login or wrong token."));
            connection.release();
          }
          else {
            var setSql = 'UPDATE room SET host = null,hostName = null,living = 0 WHERE id = ' + rows[0].roomId + ';';
            connection.query(setSql, function(err,result) {
              if(err){
                console.log(err);
                defer.reject(err);
              }
              else if(result.affectedRows != 1){
                defer.reject(new Error("stopPushStream failed for update room wrong."));
              }
              else {
                defer.resolve("stopPushStream success.");
                //通知礼物系统
                gift.room_play_stop(rows[0].roomId,rows[0].uid,false)
                  .then(function(resbody){
                    console.log("gift stopPushStream res msg:" + resbody);
                  })
                  .catch(function(errmsg){
                    console.log("gift stopPushStream res msg:" + errmsg);
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
  startPushStream : startPushStream,
  stopPushStream : stopPushStream
};
