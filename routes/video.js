var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制


var PER_COMPANY_NOMAL_USER = 0x00000001,
    PER_COMPANY_ADMIN_USER = 0x00000002,
    PER_SUPER_ADMIN_USER = 0x00000004;

router.post('/video/add', function(req, res) {
res.header("Access-Control-Allow-Origin", "*");
  if(!req.body){
    return res.status(200).send({code:1,msg:'video-add failed for no body.'});
  }
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能创建频道
    return res.status(401).send({code:1,msg:'video-add failed for no login or have no right.'});
  }    
  var name = body.name;
  var desc = body.desc;
  var downloadurl = body.url;
  var order = body.order;
  var thumb = body.thumb;
  pool.getConnection(function(err,connection){
    if(err){
      return res.status(200).send({code : 1,msg : 'connection err ' + err});
    }
    else {
        var sql = 'INSERT INTO video(name,downloadurl,desc,order,thumb) VALUES ('
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



module.exports = router;