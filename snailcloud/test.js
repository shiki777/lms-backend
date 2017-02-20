var api = require('./api');

 /*api.getRoomStreams()
     .then(function(data) {
         console.log(data)
     })
     .catch(function(e) {
         console.log(e);
     })*/
var pushUrl = 'rtmp://readyer.push.woniucloud.com:1936/readyer/uxc2f9ro';
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
