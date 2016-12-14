var api = require('./api');

// api.getRoomStreams()
//     .then(function(data) {
//         console.log(data)
//     })
//     .catch(function(e) {
//         console.log(e);
//     })
var pushUrl = 'rtmp://push.woniucloud.com/snail/qfac6kad';
var pushUrlws = api.getRoomPushUrl(pushUrl);
console.log(pushUrlws);
