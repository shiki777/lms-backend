var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制


var PER_COMPANY_NOMAL_USER = 0x00000001,
    PER_COMPANY_ADMIN_USER = 0x00000002,
    PER_SUPER_ADMIN_USER = 0x00000004;


router.options('/video/add', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.post('/video/add', function(req, res) {
res.header("Access-Control-Allow-Origin", "*");
  if(!req.body){
    return res.status(200).send({code:1,msg:'video-add failed for no body.'});
  }
  /*暂时不鉴权*/
  // var user = req.session.user;
  // if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能创建频道
  //   return res.status(401).send({code:1,msg:'video-add failed for no login or have no right.'});
  // }    
  var body = req.body;
  var name = body.name;
  var desc = body.desc;
  var downloadurl = body.url;
  var order = body.order;
  var thumb = body.thumb;
  pool.getConnection(function(err,connection){
    if(err){
        console.log('connection error ' + err.message);
      return res.status(200).send({code : 1,msg : 'connection err ' + err.message});
    }
    else {
        var sql = 'INSERT INTO video(name,downloadurl,video.desc,video.order,thumb) VALUES ('
         + pool.escape(name) + ',' + pool.escape(downloadurl) + ',' + pool.escape(desc) + ',' + pool.escape(order) + ',' + pool.escape(thumb)
          + ');';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log('video error : ' + err);
          return res.status(200).send({code : 1,msg : 'sql err ' + err});
        }
        else {
            return res.status(200).send({code : 0,msg : 'success add video'});
        }
        connection.release();
      });
    }
  });  
})

router.options('/video/update', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.post('/video/update', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (!req.query.id) {
        return res.status(200).send({
            code: 1,
            msg: 'video-update failed for no id.'
        });
    }
    if (!req.body) {
        return res.status(200).send({
            code: 1,
            msg: 'video-update failed for no body.'
        });
    }
    var body = req.body;
    var name = body.name;
    var desc = body.desc;
    var downloadurl = body.url;
    var order = body.order;
    var thumb = body.thumb;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log('connection error ' + err.message);
            return res.status(200).send({
                code: 1,
                msg: 'connection err ' + err.message
            });
        } else {
            var sql = 'UPDATE video SET name = ' + pool.escape(name) + ', downloadurl = ' + pool.escape(downloadurl) + ', video.desc = ' + pool.escape(desc) + ', video.order = ' + pool.escape(order) + ', thumb = ' + pool.escape(thumb) + ' where id = ' + req.query.id + ';';
            connection.query(sql, function(err, rows, fields) {
                if (err) {
                    console.log('video error : ' + err);
                    return res.status(200).send({
                        code: 1,
                        msg: 'sql err ' + err
                    });
                } else {
                    return res.status(200).send({
                        code: 0,
                        msg: 'success update video'
                    });
                }
                connection.release();
            });
        }
    });

});

router.get('/video/get', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (!req.query.id) {
        return res.status(200).send({
            code: 1,
            msg: 'video-get failed for no id.'
        });
    }    
    pool.getConnection(function(err, connection) {
        if(err){
            console.log(err.message);
            res.status(200).jsonp({
                code : 1,
                msg : err.message
            })
        } else {
            var sql = 'SELECT * FROM video where id = ' + pool.escape(req.query.id);
            connection.query(sql, function(err, rows, fields) {
                if(err){
                    res.status(200).jsonp({
                        code : 1,
                        msg : err
                    })
                } else {
                    res.status(200).jsonp({
                        code: 0,
                        msg: 'video-get success.',
                        data: rows[0]
                    });                    
                }
            });
        }
    });
});

router.get('/video/list', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    var page = req.query.page ? parseInt(req.query.page,10) - 1 : 0;
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
                        videolist.push(rows[i]);
                    }
                    res.status(200).jsonp({
                        code: 0,
                        msg: 'channel-list success.',
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