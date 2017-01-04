var PROTO_PATH = __dirname + '/liveassistant.proto';
var grpc = require('grpc');
var HashMap = require('hashmap').HashMap;
var host = require('../config/config.js').push_stream.host;
var port = require('../config/config.js').push_stream.port;
var assistant = grpc.load(PROTO_PATH).liveassistant;
var room = require('../snailcloud/room');

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
  host = host+':'+port;
  server.bind(host, grpc.ServerCredentials.createInsecure());
  console.log('host ', host);
  server.start();
};
server.prototype.addUser = function(username, userinfo) {
  usermap.add(username, userinfo);
};
server.prototype.delUser = function(username, userinfo) {
  usermap.remove(userinfo);
};
var communication_login = function(call, callback) {
  console.log("communication_login");
  var username = call.request.username;
  var password = call.request.password;

  console.log('username: ' + username + ' password: ' + password);

  room.login(username, password)
    .then(function(result) {
      console.log(result);
      callback(null, {
        code: 0,
        message: 'success',
        creds: result,
        token: result
      });
      service.addUser(user,clientInfo);
    })
    .catch(function(err) {
      console.log(err.message);
      callback(null, {
        code: 1,
        message: err.message,
        creds: '',
        token: ''
      });
    });
};

var communication_logout = function(call, callback) {
  console.log("communication_logout");
  var creds = call.request.creds;
  console.log('creds:', creds);
  callback(null, {
    code: 0,
    message: 'success'
  });
};

var communication_applyPushURL = function(call, callback) {
  console.log("communication_ApplyPushURL");
  var creds = call.request.creds;
  console.log('creds:', creds);
  var ret = {
    code: 0,
    URL: 'rtmp://push.snail.woniucloud.com:1937/push1/mi1t9sta?wsSecret=ffd4aeff04e1f3b4fa37da8c39c75824&wsTime=585c97b6'
  };
  console.log(ret);
  callback(null, ret);
};

var communication_startStream = function(call, callback) {
  var creds = call.request.creds;
  console.log('creds:', creds);
  console.log("communication_startStream");
  var ret = {
    code: 0,
    message: 'success'
  };
  console.log(ret);
  callback(null, ret);
};

var communication_stopStream = function(call, callback) {
  var creds = call.request.creds;
  console.log('creds:', creds);
  console.log("communication_stopStream");
  var ret = {
    code: 0,
    message: 'success'
  };
  console.log(ret);
  callback(null, ret);
};

var communication_userInfo = function(call, callback) {
  var creds = call.request.creds;
  console.log('creds:', creds);
  console.log("communication_userInfo");
  var ret = {
    code: 0,
    message: 'success',
    nickname: 'testname',
    head_icon: 'http://epg.readyvr.woniucloud.com/mz/cache/snailTV/pagefile/b5e2cfeafe61dca2e0e216d8650bcf6b.png'
  };
  console.log(ret);
  callback(null, ret);
};

var communication_roomInfo = function(call, callback) {
  var creds = call.request.creds;
  console.log('creds:', creds);
  console.log("communication_roomInfo");
  var ret = {
    code: 0,
    message: 'success',
    room_id: 1001,
    room_name: '测试房间1001',
    channel_name:'测试频道1',
    ninki:1,
    audience_count:1,
    play_status:1
  };
  console.log(ret);
  callback(null, ret);
};

var communication_chatInfo = function(call, callback) {
  var creds = call.request.creds;
  console.log('creds:', creds);
  console.log("communication_chatInfo");
  var ret ={
    code: 0,
    message: 'success',
    chat_id:1001,
    host:'192.168.5.137',
    port:8066
  };
  console.log(ret);
  callback(null, ret);
};

module.exports = server;
