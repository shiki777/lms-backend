var api = require('./api');

 /*api.getRoomStreams()
     .then(function(data) {
         console.log(data)
     })
     .catch(function(e) {
         console.log(e);
     })*/
var pushUrl = 'rtmp://s3-push.woniucloud.com:1937/push3/lhcgh2am';
// var pushUrlws = api.getRoomPushUrl(pushUrl);
var pushUrlws = api.getRoomPushUrl(pushUrl);
console.log(pushUrlws);
/*api.dropRoomStream(u2)
    .then(function(data) {
        console.log(data)
    })
    .catch(function(e) {
        console.log(e)
    })*/
// api.applyTokenAndUrl('192.168.5.48',playUrl)
//     .then(function(data){
//       console.log(data);
//     })
//     .catch(function(e){
//       console.log(e);
//     })
