var q = require('q');
var request = require('request');
var config = require('../config/config');
var snailHeaders = require('./headers');

/*从云平台获取房间推流/播放地址*/
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




module.exports = {

}