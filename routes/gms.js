var express = require('express');
var router = express.Router();

router.get('/getroomlist', function(req,res) {
    res.json({
        code: '003001',
        message: 'ok',
        data: {
            count: 2,
            list: [{
                roomid: 1001, name : '蜗牛直播间'
            }, {roomid : 1003, name : 'GOGOGO'}]
        }
    })
})

router.get('/getroomexists', function(req, res) {
    res.json({
        code : '003001',
        message : 'ok',
        exists : true
    })
})

module.exports = router;