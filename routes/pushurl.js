var express = require('express');
var router = express.Router();
var room = require('../snailcloud/room');

router.post('/login',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({ec:400,msg:"login failed for name or pwd == null."});}
  room.login(name,pwd,function(err,token){
    if(err){
      res.status(400).send({ec:400,msg:err.message});
    }
    else {
      res.status(200).send({ec:0,msg:"login success.",token:token});
    }
  });
});

router.post('/logout',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var token = req.body ? req.body.token : null;
  if(!token){return res.status(400).send({ec:400,msg:"logout failed for token == null."});}
  room.logout(token,function(err){
    if(err){
      res.status(400).send({ec:400,msg:err.message});
    }
    else {
      res.status(200).send({ec:0,msg:"logout success."});
    }
  });
});

router.post('/geturl',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var token = req.body ? req.body.token : null;
  if(!token){return res.status(400).send({ec:400,msg:"geturl failed for token == null."});}
  room.geturl(token,function(err,pushUrl){
    if(err){
      res.status(400).send({ec:400,msg:err.message});
    }
    else {
      res.status(200).send({ec:0,msg:"geturl success.",pushUrl:pushUrl});
    }
  });
});

module.exports = router;
