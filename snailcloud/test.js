var api = require('./api');

 /*api.getRoomStreams()
     .then(function(data) {
         console.log(data)
     })
     .catch(function(e) {
         console.log(e);
     })*/
var pushUrl = 'rtmp://push.woniucloud.com:1935/snial/rtugwpvy';//'rtmp://push.woniucloud.com/snail/qfac6kad';
var playUrl = 'rtmp://play.woniucloud.com:1935/snial/rtugwpvy';
var pushUrlws = api.getRoomPushUrl(pushUrl);
//console.log(pushUrlws);
api.applyTokenAndUrl('58.247.47.106',playUrl);
