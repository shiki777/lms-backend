var q = require('q');
var request = require('request');
var config = require('../config/config');
var snailHeaders = require('./headers');
var SECRETKEY = require('./secretkey').SECRETKEY;
var crypto = require('crypto');

/** 
 * 从云平台获取房间推流/播放地址
 * @returns {promise} 
 */
function getRoomStreams() {
    var path = '/v1/snailcloud/ppurl/application';
    var body = '';
    var defer = q.defer();
    var options = {
        url : snailHeaders.snail_cloud.host + ':' + snailHeaders.snail_cloud.port + path;
        method : 'GET',
        headers: snailHeaders.setHeader({body : body,method: 'get',uri : path}),
        json : true,
        body : body
    }    
    request(options, function(err,res,body) {
        if(err){
            defer.reject(err);
        } else {
            channels = formatChannel(res.body || {});
            defer.resolve(channels);
        }
    });    
    return defer.promise;
}

/** 
 * 生成推流规则
 * @returns {promise} 
 */
function getRoomPushUrl(url) {
    var reg = '/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/';
    /*获取path*/
    var uri = url.match(reg)[5];
    var wsTime = getHexStamp();
    var wsSecret = getWsSecret(SECRETKEY, uri, wsTime);
    return url + '?wsSecret=' + wsSecret + '&wsTime=' + wsTime;
}

/*获取16进制时间戳*/
function getHexStamp() {
    return Math.round(new Date().getTime()/1000).toString(16);
}

function getWsSecret(key, uri, wsTime) {
    var str = key + uri + wsTime;
    return crypto.createHash('md5').update(str).digest('hex');
}



module.exports = {
    getRoomPushUrl : getRoomPushUrl
}