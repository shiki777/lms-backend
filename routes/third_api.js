var express = require('express');
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制

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
            console.log(err);
            res.status(200).jsonp({
                code: 1,
                msg: err.message
            });
        } else {
            console.log('connected as id ' + connection.threadId);
            //超级管理员可以获取任何房间信息，公司管理员只能获取该公司所有的房间信息，而公司普通用户只能获取该用户所对应的房间信息
            var r_sql = 'SELECT * FROM room WHERE id = ' + pool.escape(id) + ';';
            connection.query(r_sql, function(err, rows, field) {
                if (err) {
                    console.log(err);
                    res.status(200).jsonp({
                        code: 1,
                        msg: err.message
                    });
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


/*给苏州网站使用*/
router.get('/videolist', function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var page = req.query.page ? parseInt(req.query.page,10) : 0;
    var pageSize = req.query.pageSize ? parseInt(req.query.pageSize,10) : 12;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log(err);
            res.status(200).jsonp({
                code: 1,
                msg: err.message
            });
        } else {
            console.log('connected as id ' + connection.threadId);
            var sql = 'SELECT * FROM video ORDER BY video.order DESC';
            connection.query(sql, function(err, rows, fields) {
                if (err) {
                    console.log('videolist connection err ' + err.message);
                    res.status(200).jsonp({
                        code: 1,
                        msg: err.message
                    });
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

module.exports = router;