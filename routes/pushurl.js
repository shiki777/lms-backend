var express = require('express');
var router = express.Router();
var api = require('../snailcloud/api');
var mysql = require('mysql');
var config = require('../config/config');
var pool = mysql.createPool(config.db_mysql);

router.post('/login',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({ec:400,msg:"login failed for name or pwd == null."});}
  pool.getConnection(function(err,connection){
    if(err){
			console.log(err);
			res.status(400).send({ec:400,err:err,msg:"login failed for connect db wrong."});
    }
		else{
			console.log('connected as id ' + connection.threadId);
			//查找用户信息
      var sql = 'SELECT backinfo.id,token FROM backinfo,user WHERE name = "' + name +
                  '" AND pwd = "' + pwd + '" AND user.id = backinfo.id;';
			connection.query(sql, function(err, rows, fields) {
			  if (err) {
					console.log(err);
					res.status(400).send({ec:400,err:err,msg:"login failed."});
          //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
  				connection.release();
				}
        else if(rows.length != 1){//只会存在一个用户
          res.status(400).send({ec:400,msg:"login failed for not exist this user or wrong pwd."});
          //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
  				connection.release();
        }
        else {
          var token = Math.round(Math.random() * 1000000000000);
          var setSql = 'UPDATE backinfo SET token = "' + token + '",status = 1 WHERE id = "' + rows[0].id + '";';
          connection.query(setSql,function(err,result){
            if(err){
              console.log(err);
              res.status(400).send({ec:400,err:err,msg:"login failed for changing status failed,please try again."});
            }
            else {
              rows[0].token = token.toString();
              res.status(200).send({ec:0,msg:"login success.",info:rows[0]});
            }
            //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
    				connection.release();
          });
        }
			});
    }
  });
});

router.post('/logout',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var id = req.body ? req.body.id : null;
  var token = req.body ? req.body.token : null;
  if(!id || !token){return res.status(400).send({ec:400,msg:"logout failed for id or token == null."});}
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
			res.status(400).send({ec:400,err:err,msg:"logout failed for connect db wrong."});
    }
    else {
      console.log('connected as id ' + connection.threadId);
			//更改登录用户信息
      var sql = 'UPDATE backinfo SET token = null,status = 0 WHERE id IN(' +
      'SELECT id FROM (SELECT id FROM backinfo WHERE id = "' + id + '" AND token = "' + token + '") AS temTable);';
      connection.query(sql,function(err,result){
        if(err){
          console.log(err);
          res.status(400).send({ec:400,err:err,msg:"logout failed for changing status failed,please try again."});
        }
        else if((result.affectedRows == 1) && (result.changedRows == 1)){
          res.status(200).send({ec:0,msg:"logout success."});
        }
        else {
          res.status(400).send({ec:400,msg:"logout failed for not unique or not exist",result:result});
        }
        //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
				connection.release();
      });
    }
  });
});

router.post('/geturl',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var id = req.body ? req.body.id : null;
  var token = req.body ? req.body.token : null;
  if(!id || !token){return res.status(400).send({ec:400,msg:"geturl failed for id or token == null."});}
  pool.getConnection(function(err,connection){
    if(err){
      console.log(err);
			res.status(400).send({ec:400,err:err,msg:"geturl failed for connect db wrong."});
    }
    else {
      console.log('connected as id ' + connection.threadId);
			//匹配该用户是否已经登录是否有权限
      var sql = 'SELECT id FROM backinfo WHERE id = "' + id + '" AND token = "' + token + '" AND status = 1;';
      connection.query(sql, function(err, rows, fields) {
        if(err){
          console.log(err);
          res.status(400).send({ec:400,err:err,msg:"geturl failed for query failed."});
        }
        else if(rows.length != 1){
          res.status(400).send({ec:400,msg:"geturl failed for not exist user or not login."});
        }
        else {
          //获取该用户为主播所在房间的推流地址
          api.getRoomStreams()
            .then(function(data){
              res.status(200).send({ec:0,msg:"geturl success.",pushUrl:data.pushUrl});
            })
            .catch(function(e){
              res.status(400).send({ec:400,err:e,msg:"geturl failed for getRoomStreams failed."});
            })
        }
        //释放连接,pool目前可以用end替代release释放，后续版本则会遗弃这种做法，所以建议用release
				connection.release();
      });
    }
  });
});

module.exports = router;
