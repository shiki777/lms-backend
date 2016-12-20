var express = require('express');
var router = express.Router();
var room = require('../snailcloud/room');

router.post('/login',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({ec:400,msg:"login failed for name or pwd == null."});}
  room.login(name,pwd,function(err,info){
    if(err){
      res.status(400).send({ec:400,err:err,msg:"login failed."});
    }
    else {
      res.status(200).send({ec:0,msg:"login success.",info:info});
    }
  });
});

router.post('/logout',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var id = req.body ? req.body.id : null;
  var token = req.body ? req.body.token : null;
  if(!id || !token){return res.status(400).send({ec:400,msg:"logout failed for id or token == null."});}
  room.logout(id,token,function(err){
    if(err){
      res.status(400).send({ec:400,err:err,msg:"logout failed."});
    }
    else {
      res.status(200).send({ec:0,msg:"logout success."});
    }
  });
});

router.post('/geturl',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var id = req.body ? req.body.id : null;
  var token = req.body ? req.body.token : null;
  if(!id || !token){return res.status(400).send({ec:400,msg:"geturl failed for id or token == null."});}
  room.geturl(id,token,function(err,pushUrl){
    if(err){
      res.status(400).send({ec:400,err:err,msg:"geturl failed."});
    }
    else {
      res.status(200).send({ec:0,msg:"geturl success.",pushUrl:pushUrl});
    }
  });
});

module.exports = router;
