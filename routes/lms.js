var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制
var api = require('../snailcloud/api');
var Users = require('../third_interface/user');
var gift = require('../third_interface/gift');
var redis = require('../third_interface/redis');

var PER_COMPANY_NOMAL_USER = 0x00000001,
    PER_COMPANY_ADMIN_USER = 0x00000002,
    PER_SUPER_ADMIN_USER = 0x00000004;

router.post('/login',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({code:1,msg:"login failed for name or pwd == null."});}
  Users.authentication(name,pwd)
    .then(function(resbody){
      pool.getConnection(function(err,connection){
        if(err){
          console.log(err);
          res.status(500).send({code:1,msg:err.message});
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'SELECT user.name as name,user.permission as permission,company.name as cname,user.companyId as companyId FROM user LEFT JOIN company on user.companyId = company.id WHERE user.name = ' + pool.escape(name) + ';';
          connection.query(sql, function(err, rows, fields) {
            if(err){
              console.log(err);
              res.status(500).send({code:1,msg:err.message});
            }
            else if(rows.length != 1){
              res.status(200).send({code:1,msg:'login failed for not exist this user.'});
            }
            else {//登录成功
              req.session.user = rows[0];
              res.status(200).send({code:0,msg:"login success."});
            }
            connection.release();
          });
        }
      });
    })
    .catch(function(errmsg){
      res.status(200).send({code:1,msg:errmsg});
    })
});

router.post('/logout',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  if(!name){return res.status(400).send({code:1,msg:"logout failed for name == null."});}
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(500).send({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'SELECT * FROM user WHERE name = ' + pool.escape(name) + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(500).send({code:1,msg:err.message});
        }
        else if (rows.length != 1) {
          res.status(200).send({code:1,msg:'logout failed for no exist this user.'});
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

router.post('/admin/register',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({code:1,msg:"register failed for name or pwd == null."});}
  var permission = null;
  var companyId = null;
  if(req.body.isSuper == undefined && req.body.companyId == undefined ){//注册普通用户
    var user = req.session.user;
    if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能注册用户
      return res.status(400).send({code:1,msg:'admin-register failed for no login or have no right.'});
    }
    permission = PER_COMPANY_NOMAL_USER;
    companyId = user.companyId;
  }
  else {
    if(req.body.companyId){//注册公司管理员
      permission = PER_COMPANY_ADMIN_USER;
      companyId = req.body.companyId;
    }
    else if(req.body.isSuper == 'true'){//超级管理员
      permission = PER_SUPER_ADMIN_USER;
    }
    else {
      return res.status(400).send({code:1,msg:'admin-register failed for isSuper wrong.'});
    }
  }
  //向用户系统注册用户，后续对接用户系统，然后在数据库中存储该用户信息
  Users.register(name,pwd)
    .then(function(resbody){
      pool.getConnection(function(err,connection){
        if(err){
          console.log(err);
          res.status(200).send({code:1,msg:err.message});
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'INSERT INTO user(name,pwd,permission,companyId) VALUES('
          + pool.escape(name) + ',' + pool.escape(pwd) + ','
          + pool.escape(permission) + ',' + pool.escape(companyId) + ');';
          console.log(sql);
          connection.query(sql, function(err, result) {
            if(err){
              console.log(err);
              res.status(200).send({code:1,msg:err.message});
            }
            else if (result.affectedRows == 1) {
              res.status(200).send({code:0,msg:"register success."});
            }
            else {
              res.status(200).send({code:1,msg:'register failed for insert wrong.'});
            }
            connection.release();
          });
        }
      });
    })
    .catch(function(errmsg){
      res.status(200).send({code:1,msg:errmsg});
    })
});

/*暴露出去直接注册的接口*/
router.get('/re', function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  Users.register('277398527@qq.com','1111111')
    .then(function(resbody){
      pool.getConnection(function(err,connection){
        if(err){
          console.log(err);
          res.status(200).send({code:1,msg:err.message});
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'INSERT INTO user(name,pwd,permission,companyId) VALUES('
          + pool.escape(resbody.data.username) + ',' + pool.escape(pwd) + ','
          + pool.escape(2) + ',' + pool.escape(7) + ');';
          console.log(sql);
          connection.query(sql, function(err, result) {
            if(err){
              console.log(err);
              res.status(200).send({code:1,msg:err.message});
            }
            else if (result.affectedRows == 1) {
              res.status(200).send({code:0,msg:"register success."});
            }
            else {
              res.status(200).send({code:1,msg:'register failed for insert wrong.'});
            }
            connection.release();
          });
        }
      });
    })
    .catch(function(errmsg){
      res.status(200).send({code:1,msg:errmsg});
    })  
})

router.get('/com', function(req,res) {
  pool.getConnection(function(err,connection) {
    var sql = 'INSERT INTO company(id,name,account,company.order) VALUES(7,"R18",3333,1)';
    connection.query(sql, function(err,result) {
      res.status(200).send('ok');
    });
  })
});

router.post('/user/email', function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  Users.sendCodetoEmail(req.body.email,req.body.name)
    .then(function() {
      res.status(200).send({code : 0,msg : 'ok'});
    })
    .catch(function(e) {
      res.status(200).send({code : 1, msg : e});
    })
})

/*此接口用于房间创建时候获取可以当主播的用户列表*/
router.get('/user/list',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能获取用户列表
    return res.status(400).jsonp({code:1,msg:'user-list failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).jsonp({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' WHERE companyId = ' + pool.escape(user.companyId) + ' AND id not in (select userId from room_user)');
      var sql = 'SELECT id,name FROM user' + condition + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:1,msg:err.message});
        }
        else {
          res.status(200).jsonp({code:0,msg:'get user list success.',list:rows});
        }
        connection.release();
      });
    }
  });
});

/*修改密码，明文传输，影响不大*/
router.get('/user/modifypwd', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能获取用户列表
    return res.status(400).jsonp({code:1,msg:'user-list failed for no login or have no right.'});
  }
  var username = req.query.username;
  var pw = req.query.pw;
  var code = req.query.code;
  Users.modifyPwd(pw,username,code)
  .then(function() {
    pool.getConnection(function(err,connection) {
      connection.query('UPDATE user SET pwd = ? where name = ?',[pw,username], function(err,rows) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:2,msg:err.message});
        } else {
          res.status(200).jsonp({code : 0, msg : 'ok'});
        }
        connection.release();
      });
    });
  })
  .catch(function(err) {
    res.status(200).jsonp({code : 11,msg : err})
  });
});

/*此接口用于主播列表页*/
router.get('/host/list',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能获取用户列表
    return res.status(400).jsonp({code:1,msg:'user-list failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).jsonp({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'select ut.`name`as username,rut.roomId as roomid,rt.`name` as roomname from user ut left join room_user rut on ut.id = rut.userId LEFT JOIN room rt on rut.roomId = rt.id where ut.companyId = ?';
      connection.query(sql,[user.companyId], function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:1,msg:err.message});
        }
        else {
          res.status(200).jsonp({code:0,msg:'get user list success.',list:rows});
        }
        connection.release();
      });
    }
  });
});

//可以一次插入多条记录，形式如：insert into table(……) values(……),(……),(……)……
//在插入操作时可以据affectedRows知道影响的行的数目，而且通过insertId知道第一个记录生成的id
/*需要考虑一个问题，不论是频道的操作还是房间的操作，对用户都有鉴权需求，特别是在删除、修改、查询上面，
普通用户没有创建的权限较为容易处理，而在删、改、查上面，超级管理员能够操作所有对象，公司管理员则只能
操作该公司所有的对象，而公司普通用户则只能操作自己所对应的对象，这个要注意删、改、查的处理逻辑*/
router.post('/channel/add',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.body){
    return res.status(200).send({code:1,msg:'channel-add failed for no body.'});
  }
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能创建频道
    return res.status(401).send({code:1,msg:'channel-add failed for no login or have no right.'});
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
      res.status(200).send({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var sql = 'INSERT INTO channel(name,companyId,charge,price,icon,thumb,channel.order,channel.desc,defaultRoom,tag) VALUES('
      + pool.escape(req.body.name) + ',' + pool.escape(companyId) + ',' + pool.escape(req.body.charge) + ','
      + pool.escape(req.body.chargeStrategy.price) + ',' + pool.escape(req.body.icon) + ',' + pool.escape(req.body.thumb)
      + ',' + pool.escape(req.body.order) + ',' + pool.escape(req.body.desc) + ',' + pool.escape(req.body.defaultRoom) + ',' + pool.escape(req.body.tag) + ');';
      connection.query(sql, function(err, result) {//insert channel.
        var channel_insert_id = result.insertId;
        if(err){
          console.log(err);
          res.status(200).send({code:1,msg:err.message});
          connection.release();
        }
        else if(result.affectedRows != 1){
          res.status(200).send({code:1,msg:'add channel result.affectedRows != 1'});
          connection.release();
        }
        else {
          var discount = req.body.chargeStrategy.discount;
          var channel_insert_id = result.insertId;
          if(discount.length <= 0){
            res.status(200).send({code:0,msg:"add channel success with no discount info."});
            /*频道创建时不更新redis是因为此时没有频道默认房间！默认房间和频道互相依赖这是产品逻辑不通*/
              // redis.insertSwitchChannelInfo();
              // redis.insertChannel(channel_insert_id);
              // redis.insertChannelList();
              // redis.insertChannelRoomList(channel_insert_id);          
            return connection.release();
          }
          var cd_values = ' VALUES';
          for(var i = 0;i < discount.length;i ++){//组建频道-折扣SQL语句
            cd_values += '(' + channel_insert_id + ',' + pool.escape(discount[i].month) + ',' + pool.escape(discount[i].discount)
            + ((i == (discount.length - 1)) ? ');' : '),');
          }
          var cd_sql = 'INSERT INTO channel_discount(channelId,amount,discount)' + cd_values;
          connection.query(cd_sql, function(err, result) {//insert channel_discount.
            if(err){
              console.log(err);
              res.status(200).send({code:1,msg:err.message});
            }
            else if(result.affectedRows != discount.length){
              res.status(200).send({code:1,msg:('insert channel_discount result.affectedRows != ' + discount.length)});
            }
            else {
              res.status(200).send({code:0,msg:"add channel success."});
               /*频道创建时不更新redis是因为此时没有频道默认房间！默认房间和频道互相依赖这是产品逻辑不通*/
              // redis.insertSwitchChannelInfo();
              // redis.insertChannel(channel_insert_id);
              // redis.insertChannelList();
              // redis.insertChannelRoomList(channel_insert_id);              
            }
            connection.release();
          });
        }
      });
    }
  });
});

/*因为存在联表关系，当某记录为另外表中某记录的外键则删除会有不同的处理策略，如拒绝删除、所有依赖部分一同删除等
所以在处理每个记录(包括其他表中的记录)的删除操作时都要考虑联表问题，包括更新策略，这些要在建表时确定策略*/
router.delete('/channel/del',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(200).send({code:1,msg:'channel-del failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能删除频道
    return res.status(401).send({code:1,msg:'channel-del failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).send({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以删除任何频道，公司管理员只能删除该公司的频道
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' AND companyId = ' + pool.escape(user.companyId));
      var sql = 'DELETE FROM channel WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(200).send({code:1,msg:err.message});
        }
        else {//result.affectedRows == 1
          res.status(200).send({code:0,msg:(result.affectedRows == 1) ? 'channel-del success.' : 'not exist this channel or have no right'});
          if(result.affectedRows == 1){
            redis.deleteChannel(req.query.id);
            redis.insertChannelList();
            redis.insertSwitchChannelInfo();
          }
        }
        connection.release();
      });
    }
  });
});

router.post('/channel/update',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(200).send({code:1,msg:'channel-update failed for no id.'});}
  var cid = parseInt(req.query.id);
  if(!req.body){return res.status(200).send({code:1,msg:'channel-update failed for no body.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能修改频道
    return res.status(401).send({code:1,msg:'channel-update failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).send({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以修改任何频道，公司管理员只能修改该公司的频道
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' AND companyId = ' + pool.escape(user.companyId));
      var sql = 'UPDATE channel SET name = ' + pool.escape(req.body.name) + ',charge = ' + pool.escape(req.body.charge)
      + ',price = ' + pool.escape(req.body.chargeStrategy.price) + ',icon = ' + pool.escape(req.body.icon)
      + ',thumb = ' + pool.escape(req.body.thumb) + ',channel.order = ' + pool.escape(req.body.order) + ',channel.tag = ' + pool.escape(req.body.tag)
      + ',channel.desc = ' + pool.escape(req.body.desc) + ',defaultRoom = ' + pool.escape(req.body.defaultRoom)
      + ' WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(200).send({code:1,msg:err.message});
          connection.release();
        }
        else if(result.affectedRows != 1){
          res.status(200).send({code:1,msg:'update channel failed that result.affectedRows != 1'});
          connection.release();
        }
        else {//先删除channel_discount表中的关于channelId的旧记录，再在其中添加新的记录
          var discount = req.body.chargeStrategy.discount;
          var cd_values = ' VALUES';
          for(var i = 0;i < discount.length;i ++){//组建频道-折扣SQL语句
            cd_values += '(' + pool.escape(req.query.id) + ',' + pool.escape(discount[i].month) + ','
            + pool.escape(discount[i].discount) + ((i == (discount.length - 1)) ? ');' : '),');
          }
          var d_sql = 'DELETE FROM channel_discount WHERE channelId = ' + pool.escape(req.query.id) + ';';
          var i_sql = (discount.length == 0) ? '' : ('INSERT INTO channel_discount(channelId,amount,discount)' + cd_values);
          connection.query(d_sql + i_sql, function(err, result) {//delete channel_discount then insert channel_discount.
            if(err){
              console.log(err);
              res.status(200).send({code:1,msg:err.message});
            }
            else if(discount.length <= 0){
              res.status(200).send({code:0,msg:"update channel success."});
              redis.insertSwitchChannelInfo();
              redis.insertChannel(cid);
              redis.insertChannelList();
              redis.insertChannelRoomList(cid);
              redis.insertDefaultChannel();
            }
            else if(result[1].affectedRows != discount.length){
              res.status(200).send({code:1,msg:('insert channel_discount.affectedRows != ' + discount.length)});
            }
            else {
              res.status(200).send({code:0,msg:"update channel success."});
              redis.insertSwitchChannelInfo();
              redis.insertChannel(cid);
              redis.insertChannelList();
              redis.insertChannelRoomList(cid);
              redis.insertDefaultChannel();
            }
            connection.release();
          });
        }
      });
    }
  });
});

router.get('/channel/get',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(400).jsonp({code:1,msg:'channel-get failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能获取频道
    return res.status(401).jsonp({code:1,msg:'channel-get failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).jsonp({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以获取任何频道，公司管理员只能获取该公司的频道
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' AND companyId = ' + pool.escape(user.companyId));
      var c_sql = 'SELECT * FROM channel WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      var cd_sql = 'SELECT amount,discount FROM channel_discount WHERE channelId = ' + pool.escape(req.query.id) + ';';
      connection.query(c_sql + cd_sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:1,msg:err.message});
        }
        else if(result[0].length != 1){
          res.status(200).jsonp({code:1,msg:'channel-get failed for not exist this channel or have no right.'});
        }
        else {
          var discount_arr = [];
          for(var i = 0;i < result[1].length;i ++){
            discount_arr.push({month:result[1][i].amount,discount:result[1][i].discount});
          }
          var data = {
            name : result[0][0].name,
            charge : result[0][0].charge,
            icon : result[0][0].icon,
            thumb : result[0][0].thumb,
            desc : result[0][0].desc,
            order : result[0][0].order,
            tag : result[0][0].tag,
            chargeStrategy : {
              price : result[0][0].price,
              discount : discount_arr
            },
            defaultRoom : result[0][0].defaultRoom
          };
          res.status(200).jsonp({code:0,msg:'channel-get success.',data:data});
        }
        connection.release();
      });
    }
  });
});

router.get('/channel/list',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.page || !req.query.pageSize){return res.status(200).jsonp({code:1,msg:'channel-list failed for no page or pageSize.'});}
  if(req.query.page <= 0 || req.query.pageSize <= 0){return res.status(200).jsonp({code:1,msg:'channel-list failed for wrong page or pageSize.'});}
  var user = req.session.user;
  // if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能获取频道列表
  //   return res.status(401).jsonp({code:1,msg:'channel-list failed for no login or have no right.'});
  // }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).jsonp({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级用户可以获取所有频道列表，公司管理员只能获取该公司的频道列表
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' WHERE companyId = ' + pool.escape(user.companyId));
      /*var sql = 'SELECT * FROM (SELECT name,thumb,icon,id FROM channel' + condition + ') AS temTable LIMIT '
      + pool.escape((parseInt(req.query.page) - 1)*parseInt(req.query.pageSize)) + ',' + pool.escape(parseInt(req.query.pageSize,10)) + ';';*/
      var sql = 'SELECT name,thumb,icon,id,tag FROM channel' + condition + ' ORDER BY tag DESC, channel.order DESC;';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:1,msg:err.message});
        }
        else {
          var chanlist = [];
          /*pagesize999代表输出全部数据*/
          if(parseInt(req.query.pageSize,10) ==999){
            res.status(200).jsonp({code:0,msg:'channel-list success.',data:{count:rows.length,list:rows}});
            return;
          }          
          var pageStart = (parseInt(req.query.page) - 1)*parseInt(req.query.pageSize);
          if(pageStart < 0){pageStart = 0;}
          var pageEnd = pageStart + parseInt(req.query.pageSize);
          for(var i = pageStart;i < pageEnd && i < rows.length;i ++){
            chanlist.push(rows[i]);
          }
          res.status(200).jsonp({code:0,msg:'channel-list success.',data:{count:rows.length,list:chanlist}});
        }
        connection.release();
      });
    }
  });
});

router.get('/channel/roomlist',function(req,res){//根据频道channelId来获取房间列表
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(200).jsonp({code:1,msg:'channel-roomlist get failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登或权限不够录则不能根据频道来获取房间列表
    return res.status(401).jsonp({code:1,msg:'channel-roomlist get failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).jsonp({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级用户可以获取任何频道对应的房间列表，公司管理员只能获取该公司的频道对应的房间列表
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' AND companyId = ' + pool.escape(user.companyId));
      var sql = 'SELECT name,id FROM room WHERE channelId = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:1,msg:err.message});
        }
        else {
          res.status(200).jsonp({code:0,msg:'channel-roomlist get success.',data:rows});
        }
        connection.release();
      });
    }
  });
});

//1,云平台申请推流及播放地址 2，写数据库操作：三个数据表的操作 3，成功后通知礼物系统该房间信息
//超级管理员也可以开通房间，此时会将房间所属的公司信息带过来，而公司管理员开通则直接使用该管理员公司信息
router.post('/room/add',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.body){
    return res.status(200).send({code:1,msg:'room-add failed for no body.'});
  }
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够或没有房间用户则不能开通房间
    return res.status(401).send({code:1,msg:'room-add failed for no login or have no right.'});
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
        pool.getConnection(function(err,connection){
          if(err){
            console.log(err);
            res.status(200).send({code:1,msg:err.message});
          }
          else {
            console.log('connected as id ' + connection.threadId);
            var pushUrl = (roomUrl.pushUrl instanceof Array) ? roomUrl.pushUrl[0] : roomUrl.pushUrl;
            var liveUrl = (roomUrl.liveUrl instanceof Array) ? roomUrl.liveUrl[0] : roomUrl.liveUrl;
            var room_sql = 'INSERT INTO room(name,channelId,companyId,pushUrl,liveUrl,living,onlineRatio,thumb,u3dbg,' +
            'room.desc,charge,price,dependencyChange,room.order,tag,viewAngle,controlModel,projectStyle,eyeStyle,domeVertical,domeHorizontal) VALUES(' +
            pool.escape(req.body.name) + ',' + pool.escape(req.body.channelId) + ',' + pool.escape(companyId) + ',' + pool.escape(pushUrl) + ',' +
            pool.escape(liveUrl) + ',' + pool.escape(req.body.living) + ',' + pool.escape(req.body.onlineRatio) + ',' +
            pool.escape(req.body.thumb) + ',' + pool.escape(req.body.u3dbg) + ',' + pool.escape(req.body.desc) + ',' +
            pool.escape(req.body.charge) + ',' + pool.escape(req.body.chargeStrategy.price) + ',' + pool.escape(req.body.dependencyCharge) + ',' +
            pool.escape(req.body.order) + ',' + pool.escape(req.body.tag) + ',' + pool.escape(req.body.viewAngle) + ',' +
            pool.escape(req.body.controlModel) + ',' + pool.escape(req.body.projectStyle) + ',' + pool.escape(req.body.eyeStyle) + ',' + pool.escape(req.body.domeVertical) + ',' + pool.escape(req.body.domeHorizontal) + ');';
            connection.query(room_sql, function(err, result) {//insert room
              if(err){
                console.log(err);
                res.status(200).send({code:1,msg:err.message});
                connection.release();
              }
              else if(result.affectedRows != 1){
                res.status(200).send({code:1,msg:'insert room result.affectedRows != 1'});
                connection.release();
              }
              else {
                var room_insert_id = result.insertId;
                var userlist = req.body.userid;
                var discount = req.body.chargeStrategy.discount;
                if(userlist.length <= 0 && discount.length <= 0){
                  res.status(200).send({code:0,msg:'add room success.'});
                  redis.insertDefaultChannel(room_insert_id);
                  //通知礼物系统
                  gift.room_add_del(room_insert_id,true)
                    .then(function(resbody){
                    })
                    .catch(function(errmsg){
                      console.log(errmsg);
                    })
                  redis.insertRoomInfo(room_insert_id);
                  redis.insertRoomPlayurl(room_insert_id,liveUrl);
                  redis.insertChannelRoomList(req.body.channelId);
                  return connection.release();
                }
                var ru_values = ' VALUES';
                var rd_values = ' VALUES';
                for(var i = 0;i < userlist.length;i ++){//组建房间-用户SQL语句
                  ru_values += '(' + room_insert_id + ',' + pool.escape(userlist[i]) + ((i == (userlist.length - 1)) ? ');' : '),');
                }
                for(var i = 0;i < discount.length;i ++){//组建房间-折扣SQL语句
                  rd_values += '(' + room_insert_id + ',' + pool.escape(discount[i].month) + ',' + pool.escape(discount[i].discount)
                  + ((i == (discount.length - 1)) ? ');' : '),');
                }
                var ru_sql = (userlist.length <= 0) ? '' : ('INSERT INTO room_user(roomId,userId)' + ru_values);
                var rd_sql = (discount.length <= 0) ? '' : ('INSERT INTO room_discount(roomId,amount,discount)' + rd_values);
                connection.query(ru_sql + rd_sql, function(err, result) {//insert room_user、room_discount.
                  if(err){
                    console.log(err);
                    res.status(200).send({code:1,msg:err.message});
                  }
                  else if((userlist.length <= 0 && discount.length > 0 && result.affectedRows != discount.length)
                    || (userlist.length > 0 && discount.length <= 0 && result.affectedRows != userlist.length)
                    || (userlist.length > 0 && discount.length > 0 && ((result[0].affectedRows != userlist.length) || (result[1].affectedRows != discount.length)))){
                      res.status(200).send({code:1,msg:('insert room_user.affectedRows != ' + userlist.length + 'or room_discount.affectedRows != ' + discount.length)});
                    }
                    else {//创建房间成功
                      res.status(200).send({code:0,msg:'add room success.'});
                      redis.insertDefaultChannel(room_insert_id);
                      //通知礼物系统
                      gift.room_add_del(room_insert_id,true)
                        .then(function(resbody){
                        })
                        .catch(function(errmsg){
                          console.log(errmsg);
                        })
                      //写redis,1:插入房间，2：有可能需要插入默认频道，仅插入一次，3：插入频道房间列表,4:插入房间播放URL
                      redis.insertRoomInfo(room_insert_id);
                      redis.insertRoomPlayurl(room_insert_id,liveUrl);
                      redis.insertChannelRoomList(req.body.channelId);
                    }
                  connection.release();
                });
              }
            });
          }
        });
    })
    .catch(function(e) {
        console.log(e);
        res.status(200).send({code:1,msg:'room-add failed for getRoomStreams wrong.'});
    })
});

/*添加单个主播*/
router.get('/room/addhost', function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.roomid){return res.status(200).send({code:1,msg:'addhost failed for no roomid.'});}
  if(!req.query.userid){return res.status(200).send({code:2,msg:'addhost failed for no userid.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能删除房间
    return res.status(401).send({code:1,msg:'room-addhost failed for no login or have no right.'});
  };
  pool.getConnection(function(err,connection) {
    if(err){
      res.status(200).send({code : 3,msg : err.msg});
    } else {
      connection.query('INSERT INTO room_user SET ?',{roomId : req.query.roomid,userId : req.query.userid}, function(err,result) {
        if(err){
          res.status(200).send({code : 4,msg : err});
        } else {
          res.status(200).send({code : 0,msg : 'ok'});
        }
      });
    }
    connection.release();
  });
})

router.delete('/room/del',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(200).send({code:1,msg:'room-del failed for no id.'});}
  var user = req.session.user;
  if(user == null || user.permission == PER_COMPANY_NOMAL_USER){//未登录或权限不够则不能删除房间
    return res.status(401).send({code:1,msg:'room-del failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      res.status(200).send({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以删除任何房间，公司管理员只能删除该公司的房间
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : (' AND companyId = ' + pool.escape(user.companyId));
      var s_sql = 'SELECT channelId FROM room WHERE id = ' + pool.escape(req.query.id) + ';';
      var d_sql = 'DELETE FROM room WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(s_sql + d_sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(200).send({code:3,msg:err.message});
        }
        else {//result[1].affectedRows == 1
          res.status(200).send({code:0,msg:(result[1].affectedRows == 1) ? 'room-del success.' : 'not exist this room or have no right.'});
          redis.deleteRoom(req.query.id);
          if(result[0].length == 1){
            redis.insertChannelRoomList(result[0][0].channelId);
          }
          //通知礼物系统
          gift.room_add_del(req.query.id,false)
            .then(function(resbody){
            })
            .catch(function(errmsg){
              console.log(errmsg);
            })
        }
        connection.release();
      });
    }
  });
});

router.post('/room/update',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(200).send({code:1,msg:'room-update failed for no id.'});}
  if(!req.body){return res.status(200).send({code:1,msg:'room-update failed for no body.'});}
  var roomid = parseInt(req.query.id,10);
  var user = req.session.user;
  if(user == null){//未登录则不能修改房间
    return res.status(401).send({code:1,msg:'room-update failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).send({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var updateHosts = req.body.users;
      if(updateHosts){
        updateUser(connection,updateHosts,req.query.id);
      }
      //超级管理员可以修改任何房间，公司管理员只能修改该公司所有的房间，而公司普通用户只能修改该用户所对应的房间
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : ((user.permission == PER_COMPANY_ADMIN_USER) ?
      (' AND companyId = ' + pool.escape(user.companyId)) : (' AND id IN(SELECT roomId FROM room_user WHERE userId = ' + pool.escape(user.id) + ')'));
      var s_sql = 'SELECT channelId FROM room WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      var u_sql = 'UPDATE room SET name = ' + pool.escape(req.body.name) + ',channelId = ' + pool.escape(req.body.channelId)
      + ',living = ' + pool.escape(req.body.living) + ',onlineRatio = ' + pool.escape(req.body.onlineRatio)
      + ',thumb = ' + pool.escape(req.body.thumb) + ',u3dbg = ' + pool.escape(req.body.u3dbg) + ',room.desc = ' + pool.escape(req.body.desc)
      + ',charge = ' + pool.escape(req.body.charge) + ',price = ' + pool.escape(req.body.chargeStrategy.price)
      + ',dependencyChange = ' + pool.escape(req.body.dependencyCharge) + ',room.order = ' + pool.escape(req.body.order)
      + ',tag = ' + pool.escape(req.body.tag) + ',viewAngle = ' + pool.escape(req.body.viewAngle)
      + ',domeHorizontal = ' + pool.escape(req.body.domeHorizontal) + ',domeVertical = ' + pool.escape(req.body.domeVertical)
      + ',controlModel = ' + pool.escape(req.body.controlModel) + ',projectStyle = ' + pool.escape(req.body.projectStyle)
      + ',eyeStyle = ' + pool.escape(req.body.eyeStyle) + ' WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(s_sql + u_sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(200).send({code:1,msg:err.message});
          connection.release();
        }
        else if(result[1].affectedRows != 1){
          res.status(200).send({code:1,msg:'update room failed that result[1].affectedRows != 1'});
          connection.release();
        }
        else {//先删除room_discount表中的关于roomId的旧记录，再在其中添加新的记录
          var preChannelId = result[0][0].channelId;
          var discount = req.body.chargeStrategy.discount;
          var rd_values = ' VALUES';
          for(var i = 0;i < discount.length;i ++){//组建房间-折扣SQL语句
            rd_values += '(' + pool.escape(req.query.id) + ',' + pool.escape(discount[i].month) + ','
            + pool.escape(discount[i].discount) + ((i == (discount.length - 1)) ? ');' : '),');
          }
          var d_sql = 'DELETE FROM room_discount WHERE roomId = ' + pool.escape(req.query.id) + ';';
          var i_sql = (discount.length <= 0) ? '' : ('INSERT INTO room_discount(roomId,amount,discount)' + rd_values);
          connection.query(d_sql + i_sql, function(err, result) {//delete room_discount then insert room_discount.
            if(err){
              console.log(err);
              res.status(200).send({code:1,msg:err.message});
            }
            else if(discount.length <= 0){
              res.status(200).send({code:0,msg:'update room success'});
              redis.insertRoomInfo(req.query.id);
              redis.insertChannelRoomList(req.body.channelId);
              if(preChannelId != req.body.channelId){
                redis.insertChannelRoomList(preChannelId);
              }
              redis.insertDefaultChannel(roomid);
              redis.insertSwitchChannelInfo();
              redis.insertChannel(req.body.channelId);
            }
            else if(result[1].affectedRows != discount.length){
              res.status(200).send({code:1,msg:('insert room_discount.affectedRows != ' + discount.length)});
            }
            else {
              res.status(200).send({code:0,msg:'update room success'});
              redis.insertRoomInfo(req.query.id);
              redis.insertChannelRoomList(req.body.channelId);
              if(preChannelId != req.body.channelId){
                redis.insertChannelRoomList(preChannelId);
              }
              redis.insertDefaultChannel(roomid);
              redis.insertSwitchChannelInfo();
              redis.insertChannel(req.body.channelId);
            }
            connection.release();
          });
        }
      });
    }
  });
});

router.post('/room/closeliving', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(200).send({code:1,msg:'room-update failed for no id.'});}
  if(!req.body){return res.status(200).send({code:1,msg:'room-update failed for no body.'});}
  var user = req.session.user;
  if(user == null){//未登录则不能修改房间
    return res.status(401).send({code:1,msg:'room-update failed for no login or have no right.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).send({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以修改任何房间，公司管理员只能修改该公司所有的房间，而公司普通用户只能修改该用户所对应的房间
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : ((user.permission == PER_COMPANY_ADMIN_USER) ?
      (' AND companyId = ' + pool.escape(user.companyId)) : (' AND id IN(SELECT roomId FROM room_user WHERE userId = ' + pool.escape(user.id) + ')'));
      var sql = 'UPDATE room SET living = 0 WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(200).send({code:1,msg:err.message});
        }
        else if(result.affectedRows != 1){
          res.status(200).send({code:1,msg:'update room failed that result.affectedRows != 1'});
        } else {
          res.status(200).send({code:0,msg:'close living room success'});
        }
        connection.release();
      });
    }
  });
});

router.get('/room/get',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.id){return res.status(200).jsonp({code:1,msg:'room-get failed for no id.'});}
  var user = req.session.user;
  if(user == null){//未登录则不能获取房间
    return res.status(401).jsonp({code:1,msg:'room-get failed for no login.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).jsonp({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级管理员可以获取任何房间信息，公司管理员只能获取该公司所有的房间信息，而公司普通用户只能获取该用户所对应的房间信息
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : ((user.permission == PER_COMPANY_ADMIN_USER) ?
      (' AND companyId = ' + pool.escape(user.companyId)) : (' AND id IN(SELECT roomId FROM room_user WHERE userId = ' + pool.escape(user.id) + ')'));
      var r_sql = 'SELECT * FROM room WHERE id = ' + pool.escape(req.query.id) + condition + ';';
      var ru_sql = 'SELECT name,id FROM user WHERE id IN(SELECT userId FROM room_user WHERE roomId = ' + pool.escape(req.query.id) + ');';
      var rd_sql = 'SELECT amount,discount FROM room_discount WHERE roomId = ' + pool.escape(req.query.id) + ';';
      connection.query(r_sql + ru_sql +  rd_sql, function(err, result) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:1,msg:err.message});
        }
        else if(result[0].length != 1){
          res.status(200).jsonp({code:1,msg:'room-get failed for not exist this room or have no right.'});
        }
        else {
          var user_arr = [];
          var discount_arr = [];
          for(var i = 0;i < result[1].length;i ++){
            user_arr.push({name:result[1][i].name,id:result[1][i].id});
          }
          for(var i = 0;i < result[2].length;i ++){
            discount_arr.push({month:result[2][i].amount,discount:result[2][i].discount});
          }
          var data = {
            name : result[0][0].name,
            channelId : result[0][0].channelId,
            tag : result[0][0].tag,
            living : result[0][0].living,
            onlineRatio : result[0][0].onlineRatio,
            users : user_arr,
            thumb : result[0][0].thumb,
            desc : result[0][0].desc,
            u3dbg : result[0][0].u3dbg,
            charge : result[0][0].charge,
            dependencyCharge : result[0][0].dependencyChange,
            order : result[0][0].order,
            viewAngle : result[0][0].viewAngle,
            controlModel : result[0][0].controlModel,
            projectStyle : result[0][0].projectStyle,
            eyeStyle : result[0][0].eyeStyle,
            domeVertical : result[0][0].domeVertical,
            domeHorizontal : result[0][0].domeHorizontal,
            chargeStrategy : {
              price : result[0][0].price,
              discount : discount_arr
            }
          };
          res.status(200).jsonp({code:0,msg:'room-get success.',data:data});
        }
        connection.release();
      });
    }
  });
});

router.get('/room/list',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  if(!req.query.page || !req.query.pageSize){return res.status(200).jsonp({code:1,msg:'room-list failed for no page or pageSize.'});}
  if(req.query.page <= 0 || req.query.pageSize <= 0){return res.status(200).jsonp({code:1,msg:'room-list failed for wrong page or pageSize.'});}
  var user = req.session.user;
  if(user == null){//未登录则不能获取房间列表
    return res.status(401).jsonp({code:1,msg:'room-list failed for no login.'});
  }
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
      res.status(200).jsonp({code:1,msg:err.message});
    }
    else {
      console.log('connected as id ' + connection.threadId);
      //超级用户可以获取所有房间列表，公司管理员只能获取该公司的房间列表，公司普通用户则只能获取自己对应的房间列表
      var condition = (user.permission == PER_SUPER_ADMIN_USER) ? '' : ((user.permission == PER_COMPANY_ADMIN_USER) ?
      (' WHERE room.companyId = ' + pool.escape(user.companyId)) : (' WHERE room.id IN(SELECT roomId FROM room_user WHERE userId = ' + pool.escape(user.id) + ')'));
      var sql = 'select room.name,room.id,room.thumb,room.living,room.hostName,room.channelId,channel.`name` AS cname from room LEFT JOIN channel on room.channelId = channel.id' + condition + ' ORDER BY channel.order DESC,room.order DESC;';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(200).jsonp({code:1,msg:err.message});
        }
        else {
          var roomlist = [];
          /*pagesize999代表输出全部数据*/
          if(parseInt(req.query.pageSize,10) ==999){
            res.status(200).jsonp({code:0,msg:'room-list success.',data:{count:rows.length,list:rows}});
            return;
          }
          var pageStart = (parseInt(req.query.page) - 1)*parseInt(req.query.pageSize);
          if(pageStart < 0){pageStart = 0;}
          var pageEnd = pageStart + parseInt(req.query.pageSize);
          for(var i = pageStart;i < pageEnd && i < rows.length;i ++){
            roomlist.push(rows[i]);
          }
          res.status(200).jsonp({code:0,msg:'room-list success.',data:{count:rows.length,list:roomlist}});
        }
        connection.release();
      });
    }
  });
});

router.options('/login', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/logout', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/admin/register', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/channel/add', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/channel/update', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/room/add', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/room/update', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/channel/delete', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});
router.options('/user/email', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, **Authorization**");
  res.status(200).end();
});

/*更新用户没有与response同步，并且没有做事务性*/
function updateUser(connection, users,roomid) {
  var addUsers = users.add;
  var delUsers = users.del;
  var addSql = 'INSERT INTO `room_user`(roomId,userId) VALUES ';
  var addValues = [];
  addUsers.map(function(k) {
    addValues.push('(' + pool.escape(roomid) + ',' + pool.escape(k) + ')');
  });
  addSql += addValues.join(',') + ';';
  var delSql = 'DELETE FROM `room_user` where userId IN (' + delUsers.join(',') + ')'; 
  if(addUsers.length > 0){
    connection.query(addSql);
  }
  if(delUsers.length > 0){
    connection.query(delSql);
  }
}

module.exports = router;
