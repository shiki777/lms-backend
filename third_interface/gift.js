var request = require('request');
var q = require('q');
var config = require('../config/config');

function room_add_del(roomId,isAdd){
  var defer = q.defer();
  if(!roomId){defer.reject('roomId == null.');}
  else {
    var path = isAdd ? '/addroom' : '/delroom';
    var body = {"rid":roomId};
    var options = {
        url : 'http://' + config.chatroom.host + ':' + config.chatroom.port + path,
        method : 'POST',
        json : true,
        body : body
    };
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

function room_play_stop(roomId,userId,isPlay){
  var defer = q.defer();
  if(!roomId || !userId){defer.reject('roomId or userId == null.');}
  else {
    var path = isPlay ? '/startlive' : '/stoplive';
    var body = {"rid":roomId,"aid":userId};
    var options = {
        url : 'http://' + config.chatroom.host + ':' + config.chatroom.port + path,
        method : 'POST',
        json : true,
        body : body
    };
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

module.exports = {
  room_add_del  : room_add_del,
  room_play_stop : room_play_stop
};
