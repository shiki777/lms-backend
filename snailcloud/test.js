var api = require('./api');

// api.getRoomStreams()
//     .then(function(data) {
//         console.log(data)
//     })
//     .catch(function(e) {
//         console.log(e);
//     })
var pushUrl = 'rtmp://push.woniucloud.com/snail/qfac6kad';
var u2 = 'rtmp://play.woniucloud.com/snail/7ofdxmb5';
// var pushUrlws = api.getRoomPushUrl(pushUrl);
var pushUrlws = api.getRoomPushUrl(u2);
api.dropRoomStream(u2)
    .then(function(data) {
        console.log(data)
    })
    .catch(function(e) {
        console.log(e)
    })