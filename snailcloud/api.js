var q = require('q');
var request = require('request');
var config = require('../config/config');
var snailHeaders = require('./headers');
var SECRETKEY = require('./secretkey').SECRETKEY;
var crypto = require('crypto');
var log4js = require('log4js');
var logger = log4js.getLogger('cloud');

/**
 * 从云平台获取房间推流/播放地址
 * @returns {promise}
 */
function getRoomStreams() {
    logger.info('getRoomStreams enter.');
    var path = '/v1/snailcloud/ppurl/application';
    var body = '';
    var defer = q.defer();
    var options = {
        url : 'http://' + config.snail_cloud.host + ':' + config.snail_cloud.port + path,
        method : 'GET',
        headers: snailHeaders.setHeader({body : body,method: 'get',uri : path}),
        json : false,
        body : body
    };
    logger.info('getRoomStreams options:',options);
    request(options, function(err,res,body) {
        if(err){
            logger.error('getRoomStreams request err' , err)
            defer.reject(err);
        } else {
            if(typeof body == 'string'){
                var data = JSON.parse(body);
            } else {
                data = body;
            }
            if(parseInt(data.errorCode,10) == 200){
              var formatData = formatRoomStreams(data);
              logger.info('getRoomStreams success:',formatData);
              defer.resolve(formatData);
            } else {
              logger.error('getRoomStreams err:',data);
              defer.reject(data.errorMessage);
            }
        }
    });
    return defer.promise;
}

/**
 * 生成推流规则
 * @returns {string} 带令牌的推流地址
 */
function getRoomPushUrl(url) {
    logger.info('getRoomPushUrl enter url:' + url);
    var reg = new RegExp(/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/);
    /*获取path*/
    var uri = '/' + reg.exec(url)[5];
    var wsTime = getHexStamp();
    var wsSecret = getWsSecret(SECRETKEY, uri, wsTime);
    return url + '?wsSecret=' + wsSecret + '&wsTime=' + wsTime;
}

/**
 * 丛云平台关闭指定房间的流
 * @param {string} pushUrl
 * @returns {promise}
 */
function dropRoomStream(pushUrl) {
  logger.info('dropRoomStream enter pushUrl:' + pushUrl);
    var path = '/v1/snailcloud/stream/drop';
    var body = '';
    var defer = q.defer();
    var options = {
        url : 'http://' + config.snail_cloud.host + ':' + config.snail_cloud.port + path + '?pushUrl=' + encodeURIComponent(pushUrl),
        method : 'DELETE',
        headers: snailHeaders.setHeader({body : body,method: 'delete',uri : path}),
        json : false,
        body : body
    }
    logger.info('dropRoomStream options:',options);
    request(options, function(err,res,body) {
        if(err){
            logger.error('dropRoomStream request err:',err);
            defer.reject(err);
        } else {
            if(typeof body == 'string'){
                var data = JSON.parse(body);
            } else {
                data = body;
            }
            if(parseInt(data.errorCode,10) == 200){
              logger.info('dropRoomStream success.');
                defer.resolve();
            } else {
              logger.error('dropRoomStream err:',data);
                defer.reject(data.errorMessage);
            }
        }
    });
    return defer.promise;
}

/**
 * 申请播放token并返回播放地址
 * @param {string} user_ip
 * @param {string} playUrl
 * @returns {promise}
 */
function applyTokenAndUrl(user_ip,playUrl){
  logger.info('applyTokenAndUrl enter user_ip:' + user_ip + ' playUrl:' + playUrl);
  var reg = new RegExp(/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/);
  var domain = reg.exec(playUrl)[3];
  var uri = '/' + reg.exec(playUrl)[5];
  var path = '/application';
  var body = '';
  var defer = q.defer();
  var options = {
      url : 'http://' + domain + ':' + config.snail_cloud.apply_playtoken_port + path + '?user_addr=' + user_ip + '&uri=' + uri,
      method : 'GET',
      headers: snailHeaders.setHeader({body : body,method: 'get',uri : uri}),
      json : false,
      body : body
  };
  logger.info('applyTokenAndUrl options:',options);
  request(options, function(err,res,body) {
      if(err){
          logger.error('applyTokenAndUrl request err:',err);
          defer.reject(err);
      } else {
          logger.info('applyTokenAndUrl success token:' + body);
          defer.resolve(playUrl + '?wsSecret=' + body);
      }
  });
  return defer.promise;
}

/*获取16进制时间戳*/
function getHexStamp() {
    return Math.round(new Date().getTime()/1000).toString(16);
}
/*生成wssecret*/
function getWsSecret(key, uri, wsTime) {
    var str = key + uri + wsTime;
    return crypto.createHash('md5').update(str).digest('hex');
}
/*格式化房间推流/播放地址*/
function formatRoomStreams(data) {
    var res = {
        pushUrl : '',
        liveUrl : []
    };
    res.pushUrl = data.pushUrl;
    for(key in data.playUrl){
        res.liveUrl.push(data.playUrl[key].url)
    }
    return res;
}

module.exports = {
    getRoomPushUrl : getRoomPushUrl,
    getRoomStreams : getRoomStreams,
    dropRoomStream : dropRoomStream,
    applyTokenAndUrl : applyTokenAndUrl
}
