var client = require('./redisClient').redisClient;
var q = require('q');

var key = 'lms_test_1';
var key = 'epg_default_channel'

client.get(key, function(err,result) {
    console.log(err)
    console.log(result);
});
