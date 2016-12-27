var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var api = require('../snailcloud/api');

router.post('/login',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({code:400,msg:"login failed for name or pwd == null."});}
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'SELECT uid,name,permission,companyId FROM user WHERE name = ' + pool.escape(name) +
                  ' AND pwd = ' + pool.escape(pwd) + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if(rows.length != 1){
          res.status(400).send({code:400,msg:'login failed for not exist this user or wrong pwd.'});
        }
        else {//登录成功
          req.session.user = rows[0];
          res.status(200).send({code:0,msg:"login success."});
        }
        connection.release();
      });
    }
  });
});

router.post('/logout',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  if(!name){return res.status(400).send({code:400,msg:"logout failed for name == null."});}
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'SELECT * FROM user WHERE name = ' + pool.escape(name) + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if (rows.length != 1) {
          res.status(400).send({code:400,msg:'logout failed for no exist this user.'});
        }
        else {
          req.session.user = null;
          res.status(200).send({code:0,msg:"logout success."});
        }
        connection.release();
      });
    }
  });
});

router.post('/admin/register',function(req,res){//私用接口，用以注册超级用户或者公司管理员用户
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({code:400,msg:"register failed for name or pwd == null."});}
  //向用户系统注册用户，后续对接用户系统，然后在数据库中存储该用户信息
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'INSERT INTO user(uid,name,pwd,permission,companyId) VALUES(' + pool.escape('_' + name) + ','
      + pool.escape(name) + ',' + pool.escape(pwd) + ',4,null);';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if (result.affectedRows == 1) {
          res.status(200).send({code:0,msg:"register success."});
        }
        else {
          res.status(400).send({code:400,msg:'register failed for insert wrong.'});
        }
        connection.release();
      });
    }
  });
});

router.post('/channel/add',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.body){
    return res.status(400).send({code:400,msg:'channel-add failed for no body.'});
  }
  var user = req.session.user;
  if(user == null || user.permission == 1){//未登录或权限不够则不能创建频道
    return res.status(400).send({code:400,msg:'channel-add failed for no login or have no right.'});
  }
  var companyId = null;
  if(user.permission == 2){//公司管理员
    companyId = user.companyId;
  }
  else if(user.permission == 4){//超级管理员
    companyId = req.body.companyId;//或者是用户名称，然后由用户名称查询用户ID
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'INSERT INTO channel(name,companyId,charge,chargeStrategy,thumb,order) VALUES('
      + pool.escape(req.body.name) + ',' + pool.escape(companyId) + ',' + pool.escape(req.body.charge) + ','
      + pool.escape(req.body.chargeStrategy) + ',' + pool.escape(req.body.thumb) + ',' + pool.escape(req.body.order) + ');';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if(result.affectedRows != 1){
          res.status(400).send({code:400,msg:'add channel result.affectedRows != 1'});
        }
        else {
          res.status(200).send({code:0,msg:"add channel success."});
        }
        connection.release();
      });
    }
  });
});

router.delete('/channel/del',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'channel-del failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == 1){//未登录或权限不够则不能删除频道
    return res.status(400).send({code:400,msg:'channel-del failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'DELETE FROM channel WHERE id = ' + pool.escape(req.query.id) + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else {//result.affectedRows == 1
          res.status(200).send({code:0,msg:(result.affectedRows == 1) ? 'channel-del success.' : 'have no this channel'});
        }
        connection.release();
      });
    }
  });
});

router.post('/channel/update',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'channel-update failed for no id.'});}
  if(!req.body){return res.status(400).send({code:400,msg:'channel-update failed for no body.'});}
  var user = req.session.user;
  if(user == null || user.permission == 1){//未登录或权限不够则不能修改频道
    return res.status(400).send({code:400,msg:'channel-update failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'UPDATE channel SET name = ' + pool.escape(req.body.name) + ',charge = ' + pool.escape(req.body.charge)
      + ',chargeStrategy = ' + pool.escape(req.body.chargeStrategy) + ',thumb = ' + pool.escape(req.body.thumb)
      + ',order = ' + pool.escape(req.body.order) + ' WHERE id = ' + pool.escape(req.query.id) + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if(result.affectedRows != 1){
          res.status(400).send({code:400,msg:'update channel failed that result.affectedRows != 1'});
        }
        else {
          res.status(200).send({code:0,msg:"update channel success."});
        }
        connection.release();
      });
    }
  });
});

router.get('/channel/get',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'channel-get failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == 1){//未登录或权限不够则不能获取频道
    return res.status(400).send({code:400,msg:'channel-get failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'SELECT * FROM channel WHERE id = ' + pool.escape(req.query.id) + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if(rows.length != 1){
          res.status(400).send({code:400,msg:'channel-get failed for not have this channel.'});
        }
        else {
          res.status(200).send({code:0,msg:'channel-get success.',data:rows[0]});
        }
        connection.release();
      });
    }
  });
});

router.get('/channel/list',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var user = req.session.user;
  if(user == null || user.permission == 1){//未登录或权限不够则不能获取频道列表
    return res.status(400).send({code:400,msg:'channel-list failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级用户可以获取所有频道列表，公司管理员只能获取该公司的频道
      var condition = (user.permission == 4) ? '' : (' WHERE companyId = ' + user.companyId);
      var sql = 'SELECT id,name,thumb FROM channel' + condition + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else {
          res.status(200).send({code:0,msg:'channel-list success.',data:rows});
        }
        connection.release();
      });
    }
  });
});

//1,云平台申请推流及播放地址并写入数据库 2，按一定命名规则向用户系统注册用户 3，通知礼物系统该房间信息
//超级管理员也可以开通房间，此时会将房间所属的公司信息带过来，而公司管理员开通则直接使用该管理员公司信息
router.post('/room/add',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.body){
    return res.status(400).send({code:400,msg:'room-add failed for no body.'});
  }
  var user = req.session.user;
  if(user == null || user.permission == 1){//未登录或权限不够则不能开通房间
    return res.status(400).send({code:400,msg:'room-add failed for no login or have no right.'});
  }
  var companyId = null;
  if(user.permission == 2){//公司管理员
    companyId = user.companyId;
  }
  else if(user.permission == 4){//超级管理员
    companyId = req.body.companyId;//或者是用户名称，然后由用户名称查询用户ID
  }
  api.getRoomStreams()
    .then(function(roomUrl) {
        var name = req.body.name + '_host';
        var pwd = 'pwd123';
        //注册
        /*对接实现*/
        //用户及房间入库
        pool.getConnection(function(err,connection){
          if(err){
            console.log(err);
            res.status(400).send({code:400,msg:err.message});
          }
          else {
            console.log('connected as id ' + connection.threadId);
            var user_sql = 'INSERT INTO user(uid,name,pwd,permission,companyId) VALUES(' + pool.escape('_' + name) + ','
            + pool.escape(name) + ',' + pool.escape(pwd) + ',1,' + pool.escape(companyId) + ');';
            connection.query(user_sql, function(err, result) {
              if(err){
                console.log(err);
                res.status(400).send({code:400,msg:err.message});
              }
              else if(result.affectedRows != 1){
                res.status(400).send({code:400,msg:'insert user result.affectedRows != 1'});
              }
              else {
                var room_sql = 'INSERT INTO room(name,channelId,companyId,pushUrl,liveUrl,host,living,onlineRatio,thumb,desc,charge,chargeStrategy,dependencyChange,order) VALUES('
                + pool.escape(name) + ',' + pool.escape(pwd) + ',1,' + pool.escape(companyId) + ');';
              }
              connection.release();
            });
          }
        });
    })
    .catch(function(e) {
        console.log(e);
        res.status(400).send({code:400,msg:'room-add failed for getRoomStreams wrong.'});
    })
});

module.exports = router;
