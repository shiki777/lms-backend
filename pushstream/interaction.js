var q = require('q');
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var api = require('../snailcloud/api');
var Users = require('../user/user');

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
                var token = resbody.data.token
                var setSql = 'INSERT INTO backinfo(id,token,status) VALUES("' + rows[0].id + '",' + pool.escape(token) + ',"1") ' +
                              'ON DUPLICATE KEY UPDATE token=VALUES(token),status=VALUES(status);';
                connection.query(setSql,function(err,result){
                  if(err){
                    console.log(err);
                    defer.reject(err);
                  }
                  else {
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

function geturl(token){
  var defer = q.defer();
  if(!token){defer.reject(new Error("geturl failed for token == null."));}
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
            defer.reject(new Error("geturl failed for not exist user or not login or wrong token."));
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

module.exports = {
  login  : login,
  logout : logout,
  geturl : geturl
};