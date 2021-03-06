var request = require('request');
var q = require('q');
var crypto = require('crypto');
var config = require('../config/config');
var log4js = require('log4js');
var userLogger = log4js.getLogger('user_sys');

function register(name,pwd){
  var defer = q.defer();
  if(!name || !pwd){defer.reject('name or pwd == null.');}
  else {
    var pwd_md5 = crypto.createHash('md5').update(pwd).digest('hex');
    var path = '/app/email/register';
    var body = {"email":name,"password":md5To16(pwd_md5),"type":"MD5"};
    var options = {
        url : 'http://' + config.user_system.host + ':' + config.user_system.port + path,
        method : 'POST',
        json : true,
        body : body
    };
    userLogger.info('register - email:' + body.email + 'password:' + body.password + 'type:' + body.type);
    request(options, function(err,res,resbody) {
        if(err){
            defer.reject(err);
            userLogger.error('register request failed - email:' + body.email + 'error msg is ' + err);
        } else {
            if(resbody.code == 0){
                defer.resolve(resbody);
            } else {
                defer.reject(resbody.message);
            }
            userLogger.info('register request success - email:' + body.email + ' code is ' + resbody.code + ' msg is ' + resbody.message);
        }
    });
  }
  return defer.promise;
}

function authentication(name,pwd){
  var defer = q.defer();
  if(!name || !pwd){defer.reject('name or pwd == null.');}
  else {
    var pwd_md5 = crypto.createHash('md5').update(pwd).digest('hex');
    var path = '/app/token';
    var body = {"username":name,"password":md5To16(pwd_md5),"type":"MD5","devid":"125978"};
    var options = {
        url : 'http://' + config.user_system.host + ':' + config.user_system.port + path,
        method : 'POST',
        json : true,
        body : body
    };
    userLogger.info('login - email:' + body.username + 'password:' + body.password + 'type:' + body.type + 'devid:' + body.devid);
    request(options, function(err,res,resbody) {
        if(err){
            defer.reject(err);
            userLogger.error('login request failed - email:' + body.username + 'error msg is ' + err);
        } else {
            if(resbody.code == 0){
                defer.resolve(resbody);
            } else {
                defer.reject(resbody.message);
            }
            userLogger.info('login request success - email:' + body.username + ' code is ' + resbody.code + ' msg is ' + resbody.message);
        }
    });
  }
  return defer.promise;
}

function modifyPwd(pw,name,code) {
  var defer = q.defer();
  var pwd_md5 = crypto.createHash('md5').update(pw).digest('hex');
  var path = '/app/email/modify';
  var body = {"email" : name,"password" : md5To16(pwd_md5),"type" : "md5",content: code};
  userLogger.info('login - modifyPWD:' + name + 'password:' + pw + 'code:' + code);
  console.log(body)
  var options = {
    url : 'http://' + config.user_system.host + ':' + config.user_system.port + path,
    method : 'POST',
    headers : {'Accept-version' : '1.0.0'},
    json : true,
    body : body
  };  
  request(options, function(err,res,resbody) {
    console.log(resbody);
    if(err){
      defer.reject(err);
      userLogger.error('modify request failed - user:' + body.username + 'error msg is ' + err);
    } else {
      if(resbody.code == 0){
        defer.resolve(resbody);
      } else {
        defer.reject(resbody.message);
      }
      userLogger.info('modify request success - user:' + body.username + ' code is ' + resbody.code + ' msg is ' + resbody.message);
    }
  });   
  return defer.promise;
}

function userinfo(token){
  var defer = q.defer();
  if(!token){defer.reject('token == null.');}
  else {
    var path = '/app/account/info';
    var options = {
        url : 'http://' + config.user_system.host + ':' + config.user_system.port + path,
        method : 'GET',
        json : true,
        headers : {'token':token},
        body : null
    };
    userLogger.info('getuserinfo - token:' + token);
    request(options, function(err,res,resbody) {
        if(err){
            defer.reject(err);
            userLogger.error('getuserinfo request failed - token:' + token + 'error msg is ' + err);
        } else {
            if(resbody.code == 0){
                defer.resolve(resbody);
            } else {
                defer.reject(resbody.message);
            }
            userLogger.info('getuserinfo request success - token:' + token + ' code is ' + resbody.code + ' msg is ' + resbody.message);
        }
    });
  }
  return defer.promise;
}

/*给邮箱发验证码*/
function sendCodetoEmail(email,name) {
  var defer = q.defer();
  var path = '/app/email/verifycode';
  var body = {"email" : email, name : name};
  var options = {
    url : 'http://' + config.user_system.host + ':' + config.user_system.port + path,
    method : 'POST',
    headers : {'Accept-version' : '1.0.0'},
    json : true,
    body : body
  };  
  console.log(body)
  request(options, function(err,res,resbody) {
    if(err){
      defer.reject(err);
    } else {
      console.log(resbody)
      if(resbody.code == 0){
        defer.resolve(resbody);
      } else {
        defer.reject(resbody.message);
      }
    }
  });   
  return defer.promise;  
}

function md5To16(data_32){
  if(data_32.length != 32){
    return '';
  }
  var val = data_32.substring(8);
  return val.substring(0,val.length - 8);
}

module.exports = {
  register  : register,
  authentication : authentication,
  userinfo : userinfo,
  modifyPwd : modifyPwd,
  sendCodetoEmail : sendCodetoEmail
};
