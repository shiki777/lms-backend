var PROTO_PATH = __dirname + '/liveassistant.proto';
var grpc = require('grpc');
var HashMap = require('hashmap').HashMap;
var host = require('../config/config.js').push_stream.host;
var port = require('../config/config.js').push_stream.port;
var assistant = grpc.load(PROTO_PATH).liveassistant;
var interaction = require('./interaction');
var log4js = require('log4js');
var logger = log4js.getLogger('pushstream');
var debug = require('debug')('pushstream/server');

function server() {
  this.usermap = new HashMap();
}

server.prototype.start = function() {
  var server = new grpc.Server();
  server.addProtoService(assistant.Communication.service, {
    login: communication_login,
    logout: communication_logout,
    applyPushUrl: communication_applyPushURL,
    startStream: communication_startStream,
    stopStream: communication_stopStream,
    userInfo: communication_userInfo,
    roomInfo: communication_roomInfo,
    chatInfo: communication_chatInfo
  });
  host = host + ':' + port;
  server.bind(host, grpc.ServerCredentials.createInsecure());
  logger.info('start host ', host);
  debug('start host ', host);
  server.start();
};
server.prototype.addUser = function(username, userinfo) {
  usermap.add(username, userinfo);
};
server.prototype.delUser = function(username, userinfo) {
  usermap.remove(userinfo);
};
var communication_login = function(call, callback) {
  var username = call.request.username;
  var password = call.request.password;

  logger.info('communication_login username: ' + username + ' password: ' + password);
  debug('communication_login username: ' + username + ' password: ' + password);
  interaction.login(username, password)
    .then(function(result) {
      logger.info(username, 'login result:', result);
      debug(username, 'login result:', result);
      callback(null, {
        code: 0,
        message: 'success',
        creds: result,
        token: result
      });
      //service.addUser(user, clientInfo);
    })
    .catch(function(err) {
      logger.error(username, 'login err:', err.message);
      debug(username, 'login err:', err.message);
      callback(null, {
        code: 1,
        message: err.message,
        creds: '',
        token: ''
      });
    });
};

var communication_logout = function(call, callback) {
  var creds = call.request.creds;
  logger.info('communication_logout creds:', creds);
  debug('communication_logout creds:', creds);
  interaction.logout(creds).then(function(result) {
    callback(null, {
      code: 0,
      message: 'success'
    });
  }).catch(function(err) {
    console.log(err.message);
    callback(null, {
      code: 1,
      message: 'creds is error'
    });
  });

};

var communication_applyPushURL = function(call, callback) {
  var creds = call.request.creds;
  logger.info('communication_ApplyPushURL creds:', creds);
  debug('communication_ApplyPushURL creds:', creds);
  interaction.getPushUrl(creds).then(function(result) {
    logger.info('getPushUrl result:', result);
    debug('getPushUrl result:', result);
    callback(null, {
      code: 0,
      URL: result
    });
  }).catch(function(err) {
    logger.error('getPushUrl err:', err.message);
    debug('getPushUrl err:', err.message);
    callback(null, {
      code: 1,
      message: 'creds is error'
    });
  });

};

var communication_startStream = function(call, callback) {
  var creds = call.request.creds;
  logger.info('communication_startStream creds:', creds);
  debug('communication_startStream creds:', creds);
  interaction.startPushStream(creds).then(function(result) {
    logger.info('startPushStream result:', result);
    debug('startPushStream result:', result);
    callback(null, {
      code: 0,
      message: 'success'
    });
  }).catch(function(err) {
    logger.error('startPushStream err:', err.message);
    debug('startPushStream err:', err.message);
    callback(null, {
      code: 1,
      message: 'creds is error'
    });
  });
};

var communication_stopStream = function(call, callback) {
  var creds = call.request.creds;
  logger.info('communication_stopStream creds:', creds);
  debug('communication_stopStream creds:', creds);
  interaction.stopPushStream(creds).then(function(result) {
    logger.info('stopPushStream result:', result);
    callback(null, {
      code: 0,
      message: 'success'
    });
  }).catch(function(err) {
    logger.error('stopPushStream err:', err.message);
    callback(null, {
      code: 1,
      message: 'creds is error'
    });
  });
};

var communication_userInfo = function(call, callback) {
  var creds = call.request.creds;
  logger.info('communication_userInfo creds:', creds);
  debug('communication_userInfo creds:', creds);
  interaction.getUserInfo(creds).then(function(result) {
    logger.info('getUserInfo result:', result);
    callback(null, {
      code: 0,
      message: 'success',
      nickname: result.nickname,
      head_icon: result.head_icon
    });
  }).catch(function(err) {
    logger.error('getUserInfo err:', err.message);
    debug('getUserInfo err:', err.message);
    callback(null, {
      code: 1,
      message: 'creds is error'
    });
  });

};

var communication_roomInfo = function(call, callback) {
  var creds = call.request.creds;
  logger.info('communication_roomInfo creds:', creds);
  debug('communication_roomInfo creds:', creds);
  interaction.getRoomInfo(creds).then(function(result) {
    logger.info('getRoomInfo result:', result);
    debug('getRoomInfo result:', result);
    callback(null, {
      code: 0,
      message: 'success',
      room_id: result.room_id,
      room_name: result.room_name,
      channel_name: result.channel_name,
      ninki: result.ninki,
      audience_count: result.audience_count,
      play_status: result.play_status
    });
  }).catch(function(err) {
    logger.error('getRoomInfo err:', err.message);
    debug('getRoomInfo err:', err.message);
    callback(null, {
      code: 1,
      message: 'creds is error'
    });
  });
};

var communication_chatInfo = function(call, callback) {
  var creds = call.request.creds;
  logger.info('communication_chatInfo creds:', creds);
  debug('communication_chatInfo creds:', creds);
  interaction.getChatInfo(creds).then(function(result) {
    logger.info('getChatInfo result:', result);
    debug('getChatInfo result:', result);
    callback(null, {
      code: 0,
      message: 'success',
      chat_id: result.chat_id,
      host: result.host,
      port: result.port
    });
  }).catch(function(err) {
    logger.error('getChatInfo err:', err.message);
    debug('getChatInfo err:', err.message);
    callback(null, {
      code: 1,
      message: 'creds is error'
    });
  });
};

module.exports = server;
