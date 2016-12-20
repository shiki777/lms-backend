var express = require('express');
var router = express.Router();
var q = require('q');
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);

function login(name,pwd){
  var defer = q.defer();
  if(!name || !pwd){defer.reject(new Error("login name or pwd == null"));}
  else {
    pool.getConnection(function(err,connection){
      if(err){
  			console.log(err);
  			defer.reject(err);
      }
  		else{
  			console.log('connected as id ' + connection.threadId);
  			//查找用户信息
        var sql = 'SELECT backinfo.id FROM backinfo,user WHERE name = "' + name +
                    '" AND pwd = "' + pwd + '" AND user.id = backinfo.id;';
  			connection.query(sql, function(err, rows, fields) {
  			  if (err) {
  					console.log(err);
  					defer.reject(err);
            //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
    				connection.release();
  				}
          else if(rows.length != 1){//只会存在一个用户
            defer.reject(new Error("login failed for not exist this user or wrong pwd."));
            //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
    				connection.release();
          }
          else {
            var token = Math.round(Math.random() * 1000000000000);
            token = token.toString() + '-' + rows[0].id.toString();
            var setSql = 'UPDATE backinfo SET token = "' + token + '",status = 1 WHERE id = "' + rows[0].id + '";';
            connection.query(setSql,function(err,result){
              if(err){
                console.log(err);
                defer.reject(err);
              }
              else {
                defer.resolve(token);
              }
              //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
      				connection.release();
            });
          }
  			});
      }
    });
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
  			//更改登录用户信息
        var sql = 'UPDATE backinfo SET token = null,status = 0 WHERE id IN(' +
        'SELECT id FROM (SELECT id FROM backinfo WHERE token = "' + token + '") AS temTable);';
        connection.query(sql,function(err,result){
          if(err){
            console.log(err);
            defer.reject(err);
          }
          else if((result.affectedRows == 1) && (result.changedRows == 1)){
            defer.resolve(null);//登出成功
          }
          else {//登出失败
            defer.reject(new Error("logout failed for not unique or not exist or wrong token."));
          }
          //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
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
  			//匹配该用户是否已经登录是否有权限
        var sql = 'SELECT id FROM backinfo WHERE token = "' + token + '" AND status = 1;';
        connection.query(sql, function(err, rows, fields) {
          if(err){
            console.log(err);
            defer.reject(err);
          }
          else if(rows.length != 1){
            defer.reject(new Error("geturl failed for not exist user or not login or wrong token."));
          }
          else {
            //获取该用户为主播所在房间的推流地址
            //后续是从数据库中获取，目前方便从接口获取或者直接给一个固定的地址
            defer.resolve('rtmp://push.woniucloud.com/snail/abcdefgh');
          }
          //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
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
