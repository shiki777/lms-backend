var net = require('net');
var schedule = require("node-schedule");
var putData = require('./dealdata.js').putData;
var logout = require('../snailcloud/room').logout;
var host = require('../config/config.js').push_stream_url.host;
var port = require('../config/config.js').push_stream_url.port;
// 创建一个TCP服务器实例，调用listen函数开始监听指定端口
// 传入net.createServer()的回调函数将作为”connection“事件的处理函数
// 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的

var start = function() {
  net.createServer(function(sock) {
    //我们获得一个连接 - 该连接自动关联一个socket对象
    console.log('CONNECTED: ' +
      sock.remoteAddress + ':' + sock.remotePort);
    //console.log(sock);
    var clientInfo = {
      sock: sock,
      time: Date.now(),
      token:0
    };

    var rule = new schedule.RecurrenceRule();
    rule.second = [0,30];
    var j = schedule.scheduleJob(rule, function() {　　　　
      console.log("schedule now time:",Date.now(),"data time",clientInfo.time);
      //心跳超时释放资源
      if (clientInfo.time + 30*3*1000<Date.now()) {
        console.log("beat time out");
        logout(clientInfo.token);
        sock.destroy();
        j.cancel();
      }
    });

    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(data) {
      var bytebuf = new Buffer(data);
      putData(bytebuf, clientInfo);
    });
    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function(data) {
      console.log('CLOSED: ' +
        sock.remoteAddress + ' ' + sock.remotePort);
      j.cancel();
    });
    sock.on('error', function(data) {
      console.log('error: ' +
        sock.remoteAddress + ' ' + sock.remotePort);
      j.cancel();
    });

  }).listen(port, host);
  console.log('push stream service listening on ' + host + ':' + port);
};
start();
exports.start = start;
