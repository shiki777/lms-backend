var express = require('express');
var router = express.Router();
var room = require('../snailcloud/room');

router.post('/login',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.body ? req.body.username : null;
  var pwd = req.body ? req.body.pwd : null;
  if(!name || !pwd){return res.status(400).send({ec:400,msg:"login failed for name or pwd == null."});}
  room.login(name,pwd)
    .then(function(token){
      res.status(200).send({ec:0,msg:"login success.",token:token});
    })
    .catch(function(err){
      res.status(400).send({ec:400,msg:err.message});
    })
});

router.post('/logout',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var token = req.body ? req.body.token : null;
  if(!token){return res.status(400).send({ec:400,msg:"logout failed for token == null."});}
  room.logout(token)
    .then(function(){
      res.status(200).send({ec:0,msg:"logout success."});
    })
    .catch(function(err){
      res.status(400).send({ec:400,msg:err.message});
    })
});

router.post('/geturl',function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var token = req.body ? req.body.token : null;
  if(!token){return res.status(400).send({ec:400,msg:"geturl failed for token == null."});}
  room.geturl(token)
    .then(function(pushUrl){
      res.status(200).send({ec:0,msg:"geturl success.",pushUrl:pushUrl});
    })
    .catch(function(err){
      res.status(400).send({ec:400,msg:err.message});
    })
});

module.exports = router;
