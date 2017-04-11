var express = require('express');
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var log4js = require('log4js');
var thirdLogger = log4js.getLogger('third');

var router = express.Router();

/*给苏州网站使用*/
router.get('/room/info', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (!req.query.id) {
        return res.status(200).jsonp({
            code: 1,
            msg: 'room-get failed for no id.'
        });
    }
    var id = parseInt(req.query.id, 10);
    var user = req.session.user;
    pool.getConnection(function(err, connection) {
        if (err) {
            res.status(200).jsonp({
                code: 1,
                msg: err.message
            });
            thirdLogger.error('/room/info db error :' + err.message);
        } else {
            //超级管理员可以获取任何房间信息，公司管理员只能获取该公司所有的房间信息，而公司普通用户只能获取该用户所对应的房间信息
            var r_sql = 'SELECT * FROM room WHERE id = ' + pool.escape(id) + ';';
            connection.query(r_sql, function(err, rows, field) {
                if (err) {
                    res.status(200).jsonp({
                        code: 1,
                        msg: err.message
                    });
                    thirdLogger.error('/room/info query error :' + err.message);
                } else {
                    if (rows[0]) {
                        var data = {
                            img: rows[0].thumb,
                            title: rows[0].name,
                            popular: id * 33 + parseInt(Math.random() * 10000, 10)
                        }
                        res.status(200).jsonp(data);
                    } else {
                        res.status(200).jsonp({
                            img : '',
                            title : '无此房间',
                            popular : 0
                        })
                    }
                }
                connection.release();
            });
        }
    });
});

/*tag分类*/
router.get('/room/list', function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    pool.getConnection(function(err, connection) {
        if (err) {
            res.status(200).jsonp({
                code: 1,
                msg: err.message
            });
            thirdLogger.error('/room/info db error :' + err.message);
        } else {
            //超级管理员可以获取任何房间信息，公司管理员只能获取该公司所有的房间信息，而公司普通用户只能获取该用户所对应的房间信息
            var r_sql = 'select room.thumb,room.name,channel.tag from room left join channel on room.channelId = channel.id order by channel.tag';
            connection.query(r_sql, function(err, rows, field) {
                if (err) {
                    res.status(200).jsonp({
                        code: 1,
                        msg: err.message
                    });
                    thirdLogger.error('/room/info query error :' + err.message);
                } else {
                    res.status(200).jsonp({
                        msg : 'ok',
                        code : 0,
                        data : rows
                    });
                }
                connection.release();
            });
        }
    });    
})

/*给苏州网站使用*/
router.get('/videolist', function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var page = req.query.page ? parseInt(req.query.page,10) : 0;
    var pageSize = req.query.pageSize ? parseInt(req.query.pageSize,10) : 12;
    pool.getConnection(function(err, connection) {
        if (err) {
            res.status(200).jsonp({
                code: 1,
                msg: err.message
            });
            thirdLogger.error('/videolist db error :' + err.message);
        } else {
            var sql = 'SELECT * FROM video ORDER BY video.order DESC';
            connection.query(sql, function(err, rows, fields) {
                if (err) {
                    res.status(200).jsonp({
                        code: 1,
                        msg: err.message
                    });
                    thirdLogger.error('/videolist query error :' + err.message);
                } else {
                    var videolist = new Array();
                    var pageStart = page * pageSize;
                    if (pageStart < 0) {
                        pageStart = 0;
                    }
                    var pageEnd = pageStart + pageSize;
                    for (var i = pageStart; i < pageEnd && i < rows.length; i++) {
                        videolist.push({
                            name : rows[i].name,
                            thumb : rows[i].thumb,
                            downloadurl : rows[i].downloadurl,
                            desc : rows[i].desc
                        });
                    }
                    res.status(200).jsonp({
                        code: 0,
                        msg: 'ok',
                        data: {
                            count: rows.length,
                            list: videolist
                        }
                    });
                }
                connection.release();
            });
        }
    });
});

/*提供给用户系统查询计费*/
router.get('/lms/charge', function(req, res) {
    var tableConfig = {
        1 : 'channel',
        2 : 'room'
    };
    var keyConfig = {
        1 : 'channelId',
        2 : 'roomId'
    };
    var id = req.query.id;
    var type = req.query.type;
    var count = req.query.count;
    if(!id){
        thirdLogger.error('/lms/charge empty id error');
        return res.status(200).json({
            code : 1,
            msg : 'id empty',
            amount : -1
        });
    }
    if(!type){
        thirdLogger.error('/lms/charge empty type error');
        return res.status(200).json({
            code : 2,
            msg : 'type  empty',
            amount : -1
        });
    }
    var type = parseInt(type,10);
    if(type != 2 && type != 1){
        thirdLogger.error('/lms/charge type illegal error - type is ' + type);
        return res.status(200).json({
            code : 5,
            msg : 'type illegal',
            amount : -1
        });        
    }
    if (!count) {
        thirdLogger.error('/lms/charge empty count error');
        return res.status(200).json({
            code: 3,
            msg: 'count empty',
            amount: -1
        });
    }
    var count = parseInt(count,10);
    if(isNaN(count)){
        thirdLogger.error('/lms/charge count illegal error - count is ' + count);
        return res.status(200).json({
            code: 5,
            msg: 'count illegal',
            amount: -1
        });        
    }
    pool.getConnection(function(err, connection) {
        if (err) {
            thirdLogger.error('/lms/charge db error :' + err.message);
            res.status(200).jsonp({
                code: 4,
                msg: err.message,
                amount: -1
            });
        } else {
            var table = tableConfig[type];
            var discountTable = table + '_discount';
            var sql = 'select ' + table + '.price as price, ' + discountTable + '.amount as amount, ' + discountTable
            + '.discount as discount from ' + table + ' LEFT JOIN ' + discountTable + ' on ' + table + '.id = ' + discountTable + '.' + keyConfig[type] +  ' where ' 
            + table + '.id = ' + pool.escape(id) + ';';
            connection.query(sql, function(err, rows, field) {
                if (err) {
                    thirdLogger.error('/lms/charge query error :' + err.message);
                    res.status(200).jsonp({
                        code: 1,
                        msg: err.message,
                        amount : -1
                    });
                } else {
                    if (rows[0]) {
                        var price = rows[0].price;
                        var discount = getStrategy(rows);
                        if(price == 0){
                            res.status(200).jsonp({
                                code : 0,
                                msg : 'ok',
                                amount : 0
                            });                            
                        } else {
                            res.status(200).jsonp({
                                code : 0,
                                msg : 'ok',
                                amount : getAmount(count, discount,price)
                            }); 
                        }
                    } else {
                        res.status(200).jsonp({
                            code : 7,
                            msg : 'no room/channel exists',
                            amount : -1
                        })
                    }
                }
                connection.release();
            });
        }
    });    

});

function getStrategy(rows) {
  var s = [];
  for(var i = 0; i < rows.length; i++){
      s.push({
        mouth : rows[i].amount,
        discount : rows[i].discount
      });
  }
  return s;
}

function getAmount(count,discounts,price) {
    if(discounts.length == 0){
        return count * price;
    }
    for(var i = 0; i < discounts.length; i++){
        if(discounts[i].mouth == count){
            return count * price * discounts[i].discount;
        }
    }
    return count * price;
}
module.exports = router;