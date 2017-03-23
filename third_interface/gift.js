var request = require('request');
var q = require('q');
var config = require('../config/config');
var log4js = require('log4js');
var giftLogger = log4js.getLogger('gift_sys');

function room_add_del(roomId,isAdd){
  var defer = q.defer();
  if(!roomId && parseInt(roomId) != 0){defer.reject('roomId == null.');}
  else {
    var path = isAdd ? '/addroom' : '/delroom';
    var body = {"rid":roomId + ''};
    var options = {
        url : 'http://' + config.chatroom.host + ':' + config.chatroom.port + path,
        method : 'POST',
        json : true,
        body : body
    };
    if(isAdd){
      giftLogger.info('addroom - roomid:' + body.rid);
    } else {
      giftLogger.info('deleteroom - roomid:' + body.rid);
    }
    request(options, function(err,res,resbody) {
      resbody = resbody || {};
        if(err){
            defer.reject(err);
            if(isAdd){
              giftLogger.error('addroom request failed - roomid:' + body.rid + ' err msg is ' + err);
            } else {
              giftLogger.error('deleteroom request failed - roomid:' + body.rid + ' err msg is ' + err);
            }
        } else {
            if(resbody.code == 0){
                defer.resolve(resbody);
            } else {
                defer.reject(resbody.message);
            }
        }
            if(isAdd){
              giftLogger.info('addroom request success - roomid:' + body.rid + ' code is ' + resbody.code + ' msg is ' + resbody.message);
            } else {
              giftLogger.info('delroom request success - roomid:' + body.rid + ' code is ' + resbody.code + ' msg is ' + resbody.message);
            }        
    });
  }
  return defer.promise;
}

function room_play_stop(roomId, userId, isPlay) {
  var defer = q.defer();
  if((!roomId && parseInt(roomId) != 0)
  || (!userId && parseInt(userId) != 0)){defer.reject('roomId or userId == null.');}
  else {
    var path = isPlay ? '/startlive' : '/stoplive';
    var body = {"rid":roomId + '',"aid":userId + ''};
    var options = {
      url: 'http://' + config.chatroom.host + ':' + config.chatroom.port + path,
      method: 'POST',
      json: true,
      body: body
    };
    if (isPlay) {
      giftLogger.info('startlive - roomid:' + body.rid + ' userid:' + body.aid);
    } else {
      giftLogger.info('stoplive - roomid:' + body.rid + ' userid:' + body.aid);
    }
    request(options, function(err, res, resbody) {
      if (err) {
        defer.reject(err);
        if (isPlay) {
          giftLogger.error('startlive request failed - roomid:' + body.rid + ' userid:' + body.aid + ' err msg is ' + err);
        } else {
          giftLogger.error('stoplive request failed - roomid:' + body.rid + ' userid:' + body.aid + ' err msg is ' + err);
        }
      } else {
        if (resbody.code == 0) {
          defer.resolve(resbody);
        } else {
          defer.reject(resbody.message);
        }
        if (isPlay) {
          giftLogger.info('startlive request success - roomid:' + body.rid + ' userid:' + body.aid + ' code is ' + resbody.code + ' msg is ' + resbody.message);
        } else {
          giftLogger.info('stoplive request success - roomid:' + body.rid + ' userid:' + body.aid + ' code is ' + resbody.code + ' msg is ' + resbody.message);
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
