var room = require('../snailcloud/room');

var head_len = 8;
var lms_version = 1;



var putData = function(data, clientInfo) {
  var bodylen = getBodyLen(data);
  if (bodylen === 0) {
    return;
  }
  var version = getVersion(data);
  if (version !== lms_version) {
    console.log('version error');
    return;
  }
  var bufferlen = bodylen + head_len;
  var body = data.toString('utf8', head_len, bufferlen);

  onReceivePackData(body, clientInfo);

  var newdata = data.slice(bufferlen);
  //循环处理数据
  putData(newdata, clientInfo);
};

function getBodyLen(aRecv) {
  var len = (aRecv[0] & 0xff) | ((aRecv[1] << 8) & 0xff00) | ((aRecv[2] << 16) & 0xff0000) | ((aRecv[3] << 32) & 0xff000000);
  console.log('Body length:', len);
  return len;
}

function getVersion(aRecv) {
  var version = (aRecv[4] & 0xff) | ((aRecv[5] << 8) & 0xff00);
  console.log('version:', version);
  return version;
}

/** 一个完整的包*/
function onReceivePackData(result, clientInfo) {
  console.log(result);
  //debugger
  // 回发该数据，客户端将收到来自服务端的数据
  //sock.write('You said "' + data + '"');
  try {
    var data = JSON.parse(result);
    //var data= result;
    console.log(data.method);
    console.log(data.params);
    //sock.write('{"code":0,"message":"success"}');
    switch (data.method) {
      case 'login':
        login(data.params.user, data.params.password, clientInfo.sock);
        break;
      case 'logout':
        logout(data.params.token, clientInfo.sock);
        break;
      case 'get_push_stream_url':
        get_push_stream_url(data.params.token, clientInfo.sock);
        break;
      case 'beat':
        beat(data.params.time, clientInfo);
        break;
      default:
        console.log('unknow method');
        break;
    }
  } catch (e) {
    console.log(e.message);
    //sock.write(error_msg);
  }
}

var login = function(user, password, sock) {
  console.log(user, password);

  var loginInfo;
  room.login(user, password)
    .then(function(result) {
      console.log(result);
      loginInfo = {
        "method": "login",
        "data": {
          "code": 0,
          "message": "success",
          "token": result
        }
      };
      sendData(loginInfo, sock);
    })
    .catch(function(err) {
      loginInfo = {
        "method": "login",
        "data": {
          "code": 1,
          "message": err.message,
        }
      };
      sendData(loginInfo, sock);
    });

};

var logout = function(token, sock) {
  console.log("logout token:", token);

  var logoutInfo;
  room.logout(token)
    .then(function() {
      loginInfo = {
        "method": "logout",
        "data": {
          "code": 0,
          "message": "success",
        }
      };
      sendData(loginInfo, sock);
    })
    .catch(function(err) {
      console.log(err.message);
      loginInfo = {
        "method": "logout",
        "data": {
          "code": 2,
          "message": err.message,
        }
      };
      sendData(loginInfo, sock);
    });

};

var get_push_stream_url = function(token, sock) {
  console.log("get_push_stream_url token:", token);

  var urlInfo;
  room.geturl(token)
    .then(function(result) {
      console.log(result);
      urlInfo = {
        "method": "get_push_stream_url",
        "data": {
          "code": 0,
          "message": "success",
          "url": result
        }
      };
      sendData(urlInfo, sock);
    })
    .catch(function(err) {
      console.log(err.message);
      urlInfo = {
        "method": "get_push_stream_url",
        "data": {
          "code": 3,
          "message": err.message,
        }
      };
      sendData(urlInfo, sock);
    });

};
var beat = function(time, clientInfo) {
  var beatInfo = {
    "method": "beat",
    "data": {
      "code": 0,
      "message":"success",
      "time": Math.ceil(Date.now() / 10)
    }
  };
  clientInfo.time = Date.now();
  sendData(beatInfo, clientInfo.sock);
};
var sendData = function(data, sock) {
  var body = JSON.stringify(data);
  var bodylen = body.length;
  console.log(body);
  var buff = new Buffer(head_len + bodylen);
  console.log("bodylen:", bodylen);
  buff[0] = bodylen & 0x000000ff;
  buff[1] = bodylen & 0x0000ff00;
  buff[2] = bodylen & 0x00ff0000;
  buff[3] = bodylen & 0xff000000;
  var version = 1;

  buff[4] = lms_version & 0x00ff;
  buff[5] = lms_version & 0xff00;

  var len = buff.write(body, head_len, bodylen);
  console.log(len);
  sock.write(buff);
};
exports.putData = putData;
exports.logout = logout;
