var api = require('./api');

api.getRoomStreams()
    .then(function(data) {
        console.log(data)
    })
    .catch(function(e) {
        console.log(e);
    })
