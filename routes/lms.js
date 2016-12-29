var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var api = require('../snailcloud/api');
var PER_COMPANY_NOMAL_USER = 0x00000001,
    PER_COMPANY_ADMIN_USER = 0x00000002,
    PER_SUPER_ADMIN_USER = 0x00000004;

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
      var sql = 'SELECT * FROM user WHERE name = ' + pool.escape(name) +
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

/*需要考虑一个问题，不论是频道的操作还是房间的操作，对用户都有鉴权需求，特别是在删除、修改、查询上面，
普通用户没有创建的权限较为容易处理，而在删、改、查上面，超级管理员能够操作所有对象，公司管理员则只能
操作该公司所有的对象，而公司普通用户则只能操作自己所对应的对象，这个要注意删、改、查的处理逻辑*/
router.post('/channel/add',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.body){
    return res.status(400).send({code:400,msg:'channel-add failed for no body.'});
  }
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能创建频道
    return res.status(400).send({code:400,msg:'channel-add failed for no login or have no right.'});
  }
  var companyId = null;
  if(user.permission == PER_COMPANY_ADMIN_USER){//公司管理员
    companyId = user.companyId;
  }
  else if(user.permission == PER_SUPER_ADMIN_USER){//超级管理员
    companyId = req.body.companyId;//或者是公司名称，然后由公司名称查询公司ID
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'INSERT INTO channel(name,companyId,charge,chargeStrategy,thumb,channel.order) VALUES('
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

/*因为存在联表关系，当某记录为另外表中某记录的外键则删除会有不同的处理策略，如拒绝删除、所有依赖部分一同删除等
所以在处理每个记录(包括其他表中的记录)的删除操作时都要考虑联表问题，包括更新策略，这些要在建表时确定策略*/
router.delete('/channel/del',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'channel-del failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能删除频道
    return res.status(400).send({code:400,msg:'channel-del failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以删除任何频道，公司管理员只能删除该公司的频道
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' :
      (' AND id IN(SELECT id FROM (SELECT id FROM channel WHERE companyId = ' + pool.escape(user.companyId) + ') AS temTable)');
      var sql = 'DELETE FROM channel WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else {//result.affectedRows == 1
          res.status(200).send({code:0,msg:(result.affectedRows == 1) ? 'channel-del success.' : 'not exist this channel or have no right'});
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
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能修改频道
    return res.status(400).send({code:400,msg:'channel-update failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以修改任何频道，公司管理员只能修改该公司的频道
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' :
      (' AND id IN(SELECT id FROM (SELECT id FROM channel WHERE companyId = ' + pool.escape(user.companyId) + ') AS temTable)');
      var sql = 'UPDATE channel SET name = ' + pool.escape(req.body.name) + ',charge = ' + pool.escape(req.body.charge)
      + ',chargeStrategy = ' + pool.escape(req.body.chargeStrategy) + ',thumb = ' + pool.escape(req.body.thumb)
      + ',channel.order = ' + pool.escape(req.body.order) + ' WHERE id = ' + pool.escape(req.query.id) + condition + ';';
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
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能获取频道
    return res.status(400).send({code:400,msg:'channel-get failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以获取任何频道，公司管理员只能获取该公司的频道
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' :
      (' AND id IN(SELECT id FROM (SELECT id FROM channel WHERE companyId = ' + pool.escape(user.companyId) + ') AS temTable)');
      var sql = 'SELECT * FROM channel WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if(rows.length != 1){
          res.status(400).send({code:400,msg:'channel-get failed for not exist this channel or have no right.'});
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
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能获取频道列表
    return res.status(400).send({code:400,msg:'channel-list failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级用户可以获取所有频道，公司管理员只能获取该公司的频道
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' WHERE companyId = ' + user.companyId);
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

router.get('/channel/roomlist',function(req,res){//根据频道channelId来获取房间列表
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'channel-roomlist get failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登或权限不够录则不能根据频道来获取房间列表
    return res.status(400).send({code:400,msg:'channel-roomlist get failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级用户可以获取任何频道对应的房间列表，公司管理员只能获取该公司的频道对应的房间列表
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' :
      (' AND channelId IN(SELECT id FROM channel WHERE companyId = ' + pool.escape(user.companyId) + ')');
      var sql = 'SELECT id,name FROM room WHERE channelId = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else {
          res.status(200).send({code:0,msg:'channel-roomlist get success.',data:rows});
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
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER
  || req.body.userNum <= 0){//未登录或权限不够或没有房间用户则不能开通房间
    return res.status(400).send({code:400,msg:'room-add failed for no login or have no right or no user.'});
  }
  var companyId = null;
  if(user.permission == PER_COMPANY_ADMIN_USER){//公司管理员
    companyId = user.companyId;
  }
  else if(user.permission == PER_SUPER_ADMIN_USER){//超级管理员
    companyId = req.body.companyId;//或者是公司名称，然后由公司名称查询公司ID
  }
  api.getRoomStreams()
    .then(function(roomUrl) {
        /*向用户中心注册userNum个房间用户*/
        register_room_user(req.body.userNum,function(userlist){
          if(userlist == null){return res.status(400).send({code:400,msg:'room-add failed for register_room_user wrong.'});}
          //用户及房间入库
          pool.getConnection(function(err,connection){
            if(err){
              console.log(err);
              res.status(400).send({code:400,msg:err.message});
            }
            else {
              console.log('connected as id ' + connection.threadId);
              var room_insert_id = null;
              var room_sql = 'INSERT INTO room(name,channelId,companyId,pushUrl,liveUrl,living,onlineRatio,thumb,u3dbg,' +
              'room.desc,charge,chargeStrategy,dependencyChange,room.order,tag) VALUES(' + pool.escape(req.body.name) + ',' +
              pool.escape(req.body.channelId) + ',' + pool.escape(companyId) + ',' + pool.escape(roomUrl.pushUrl) + ',' +
              pool.escape(roomUrl.liveUrl) + ',' + pool.escape(req.body.living) + ',' + pool.escape(req.body.onlineRatio) + ',' +
              pool.escape(req.body.thumb) + ',' + pool.escape(req.body.u3dbg) + ',' + pool.escape(req.body.desc) + ',' +
              pool.escape(req.body.charge) + ',' + pool.escape(req.body.chargeStrategy) + ',' + pool.escape(req.body.dependencyChange) + ',' +
              pool.escape(req.body.order) + ',' + pool.escape(req.body.tag) + ');';
              connection.query(room_sql, function(err, result) {//insert room
                if(err){
                  console.log(err);
                  res.status(400).send({code:400,msg:err.message});
                  connection.release();
                }
                else if(result.affectedRows != 1){
                  res.status(400).send({code:400,msg:'insert room result.affectedRows != 1'});
                  connection.release();
                }
                else {
                  room_insert_id = result.insertId;
                  var user_insert_startId = null;
                  var user_values = ' VALUES';
                  //可以一次插入多条记录，形式如：insert into table(……) values(……),(……),(……)……
                  //在插入操作时可以据affectedRows知道影响的行的数目，而且通过insertId知道第一个记录生成的id
                  for(var i = 0;i < userlist.length;i ++){//组建用户SQL语句
                    user_values += '(' + pool.escape(userlist[i].uid) + ',' + pool.escape(userlist[i].name) + ',' +
                    pool.escape(userlist[i].pwd) + ',1,' + pool.escape(companyId) + ((i == (userlist.length - 1)) ? ');' : '),');
                  }
                  var user_sql = 'INSERT INTO user(uid,name,pwd,permission,companyId)' + user_values;
                  connection.query(user_sql, function(err, result) {//insert user
                    if(err){
                      console.log(err);
                      res.status(400).send({code:400,msg:err.message});
                      connection.release();
                    }
                    else if(result.affectedRows != userlist.length){
                      res.status(400).send({code:400,msg:('insert user result.affectedRows != ' + userlist.length)});
                      connection.release();
                    }
                    else {
                      user_insert_startId = result.insertId;
                      var ru_values = ' VALUES';
                      for(var i = 0;i < userlist.length;i ++){//组建房间-用户SQL语句
                        ru_values += '(' + room_insert_id + ',' + (user_insert_startId + i) + ((i == (userlist.length - 1)) ? ');' : '),');
                      }
                      var ru_sql = 'INSERT INTO room_user(roomId,userId)' + ru_values;
                      connection.query(ru_sql, function(err, result) {//insert room_user
                        if(err){
                          console.log(err);
                          res.status(400).send({code:400,msg:err.message});
                        }
                        else if(result.affectedRows != userlist.length){
                          res.status(400).send({code:400,msg:('insert room_user result.affectedRows != ' + userlist.length)});
                        }
                        else {//创建房间成功
                          res.status(200).send({code:0,msg:'add room success.',data:{user:userlist}});
                          //后续对接通知礼物系统
                        }
                        connection.release();
                      });
                    }
                  });
                }
              });
            }
          });
        });
    })
    .catch(function(e) {
        console.log(e);
        res.status(400).send({code:400,msg:'room-add failed for getRoomStreams wrong.'});
    })
});

router.delete('/room/del',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'room-del failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能删除房间
    return res.status(400).send({code:400,msg:'room-del failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以删除任何房间，公司管理员只能删除该公司的房间
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' :
      (' AND id IN(SELECT id FROM (SELECT id FROM room WHERE companyId = ' + pool.escape(user.companyId) + ') AS temTable)');
      var sql = 'DELETE FROM room WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else {//result.affectedRows == 1
          res.status(200).send({code:0,msg:(result.affectedRows == 1) ? 'room-del success.' : 'not exist this room or have no right.'});
        }
        connection.release();
      });
    }
  });
});

router.post('/room/update',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'room-update failed for no id.'});}
  if(!req.body){return res.status(400).send({code:400,msg:'room-update failed for no body.'});}
  var user = req.session.user;
  if(user == null){//未登录则不能修改房间
    return res.status(400).send({code:400,msg:'room-update failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以修改任何房间，公司管理员只能修改该公司所有的房间，而公司普通用户只能修改该用户所对应的房间
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : ((user.permission == PER_COMPANY_ADMIN_USER) ?
      (' AND id IN(SELECT id FROM (SELECT id FROM room WHERE companyId = ' + pool.escape(user.companyId) + ') AS temTable)') :
      (' AND id IN(SELECT roomId FROM room_user WHERE userId = ' + pool.escape(user.id) + ')'));
      var sql = 'UPDATE room SET name = ' + pool.escape(req.body.name) + ',channelId = ' + pool.escape(req.body.channelId)
      + ',living = ' + pool.escape(req.body.living) + ',onlineRatio = ' + pool.escape(req.body.onlineRatio)
      + ',thumb = ' + pool.escape(req.body.thumb) + ',room.desc = ' + pool.escape(req.body.desc)
      + ',charge = ' + pool.escape(req.body.charge) + ',chargeStrategy = ' + pool.escape(req.body.chargeStrategy)
      + ',dependencyChange = ' + pool.escape(req.body.dependencyChange)
      + ',room.order = ' + pool.escape(req.body.order) + ' WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if(result.affectedRows != 1){
          res.status(400).send({code:400,msg:'update room failed that result.affectedRows != 1'});
        }
        else {
          res.status(200).send({code:0,msg:"update room success."});
        }
        connection.release();
      });
    }
  });
});

router.get('/room/get',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).send({code:400,msg:'room-get failed for no id.'});}
  var user = req.session.user;
  if(user == null){//未登录则不能获取房间
    return res.status(400).send({code:400,msg:'room-get failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以获取任何房间信息，公司管理员只能获取该公司所有的房间信息，而公司普通用户只能获取该用户所对应的房间信息
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : ((user.permission == PER_COMPANY_ADMIN_USER) ?
      (' AND id IN(SELECT id FROM (SELECT id FROM room WHERE companyId = ' + pool.escape(user.companyId) + ') AS temTable)') :
      (' AND id IN(SELECT roomId FROM room_user WHERE userId = ' + pool.escape(user.id) + ')'));
      var sql = 'SELECT name,channelId,living,onlineRatio,thumb,room.desc,charge,dependencyChange,room.order,chargeStrategy FROM room WHERE id = '
      + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else if(rows.length != 1){
          res.status(400).send({code:400,msg:'room-get failed for not exist this room or have no right.'});
        }
        else {
          res.status(200).send({code:0,msg:'room-get success.',data:rows[0]});
        }
        connection.release();
      });
    }
  });
});

router.get('/room/list',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var user = req.session.user;
  if(user == null){//未登录则不能获取房间列表
    return res.status(400).send({code:400,msg:'room-list failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(400).send({code:400,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级用户可以获取所有房间列表，公司管理员只能获取该公司的房间列表，公司普通用户则只能获取自己对应的房间列表
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : ((user.permission == PER_COMPANY_ADMIN_USER) ?
      (' WHERE companyId = ' + user.companyId) : (' WHERE id IN(SELECT roomId FROM room_user WHERE userId = ' + pool.escape(user.id) + ')'));
      var sql = 'SELECT id,name,thumb FROM room' + condition + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({code:400,msg:err.message});
        }
        else {
          res.status(200).send({code:0,msg:'room-list success.',data:rows});
        }
        connection.release();
      });
    }
  });
});

function register_room_user(number,cb){//根据number值来向用户系统注册相同数目的房间用户
  if(number <= 0){
    return cb(null);
  }
  cb(null);
}

module.exports = router;
