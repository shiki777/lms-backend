var request = require('request');
var q = require('q');
var crypto = require('crypto');
var config = require('../config/config');

function register(name,pwd){
  var defer = q.defer();
  if(!name || !pwd){defer.reject('name or pwd == null.');}
  else {
    var pwd_md5 = crypto.createHash('md5').update(pwd).digest('hex');
    console.log(pwd_md5);
    var path = '/app/email/register';
    var body = {"email":name,"password":md5To16(pwd_md5),"type":"MD5"};
    var options = {
        url : 'http://' + config.user_system.host + ':' + config.user_system.port + path,
        method : 'POST',
        json : true,
        body : body
    };
    console.log(options);
    request(options, function(err,res,resbody) {
        if(err){
            console.log('error is ' +  err)
            defer.reject(err);
        } else {
            if(resbody.code == 0){
                defer.resolve(resbody);
            } else {
                defer.reject(resbody.message);
            }
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
    console.log(pwd_md5);
    var path = '/app/token';
    var body = {"username":name,"password":md5To16(pwd_md5),"type":"MD5","devid":"125978"};
    var options = {
        url : 'http://' + config.user_system.host + ':' + config.user_system.port + path,
        method : 'POST',
        json : true,
        body : body
    };
    console.log(options);
    request(options, function(err,res,resbody) {
        if(err){
            console.log('error is ' +  err)
            defer.reject(err);
        } else {
            if(resbody.code == 0){
                defer.resolve(resbody);
            } else {
                defer.reject(resbody.message);
            }
        }
    });
  }
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
    console.log(options);
    request(options, function(err,res,resbody) {
        if(err){
            console.log('error is ' +  err)
            defer.reject(err);
        } else {
            if(resbody.code == 0){
                defer.resolve(resbody);
            } else {
                defer.reject(resbody.message);
            }
        }
    });
  }
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
  userinfo : userinfo
};
