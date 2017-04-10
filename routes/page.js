var express = require('express');
var router = express.Router();
var portal = require('../ui/user_portal');
var titleMsg = require('../ui/title');
router.get('/login', function(req,res) {
  var isSuper = req.query.reg ? true : false;
  res.render('./login/login',{
    message : 'var isSuper = ' + isSuper,
    title : titleMsg.getTitle('/login'),
    user : '1',
    cname : '1'
  });
});

router.use('/', function(req, res, next) {
    if(req.session.user){
        next();
    } else {
            // 到达此路径则渲染index文件，并传出title值供 index.html使用
            res.redirect(302,'./login');
    }
})

router.get('/index', function(req, res) {
  var user = req.session.user || {permission : 1};
  res.render('./user/portal',{
    pagelist : portal.renderPortal(user.permission),
    title : titleMsg.getTitle('/index'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    user : user.name,
    cname : user.cname,
    currentmsg : 'var currentUrl = "/lms/page/index"'
  });  
})

router.get('/register', function(req,res) {
  var isSuper = req.query.reg ? true : false;
  var user = req.session.user || {permission : 1};
  res.render('./login/register',{
    message : 'var isSuper = ' + isSuper,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/register'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/register"'
  });
});

router.get('/channelcreate', function(req,res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = isSuper ? '<a href="/cms/admin/rolemanager" target="_self" id="role-list">权限管理</a>' : '';
  html = '';
  res.render('./channel/create',{
    message : html,
    user : user.name,
    cname : user.cname,
    sidemsg : 'var side =' + portal.getSide(user.permission),
    title : titleMsg.getTitle('/channelcreate'),
    currentmsg : 'var currentUrl = "/lms/page/channelcreate"'
  });
});

router.get('/channelupdate', function(req,res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = isSuper ? '<a href="/cms/admin/rolemanager" target="_self" id="role-list">权限管理</a>' : '';
  html = '';
  res.render('./channel/update',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/channelupdate'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/channelupdate"'
  });
});

router.get('/channellist', function(req,res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = isSuper ? '<a href="/cms/admin/rolemanager" target="_self" id="role-list">权限管理</a>' : '';
  html = '';
  res.render('./channel/channellist',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/channellist'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/channellist"'
  });
});

router.get('/roomcreate', function(req,res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = isSuper ? '<a href="/cms/admin/rolemanager" target="_self" id="role-list">权限管理</a>' : '';
  html = '';
  res.render('./room/create',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/roomcreate'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/roomcreate"'
  });
});

router.get('/roomupdate', function(req, res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = isSuper ? '<a href="/cms/admin/rolemanager" target="_self" id="role-list">权限管理</a>' : '';
  html = '';
  res.render('./room/update',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/roomupdate'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/roomupdate"'
  });
});

router.get('/roomlist', function(req, res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = isSuper ? '<a href="/cms/admin/rolemanager" target="_self" id="role-list">权限管理</a>' : '';
  html = '';
  res.render('./room/roomlist',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/roomlist'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/roomlist"'
  });
});

router.get('/videocreate', function(req, res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = '';
  res.render('./video/create',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/videocreate'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/videocreate"'
  });
});

router.get('/videoupdate', function(req, res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = '';
  res.render('./video/update',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/videoupdate'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/videoupdate"'
  });
});

router.get('/videolist', function(req, res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = '';
  res.render('./video/videolist',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/videolist'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/videolist"'
  });
});

router.get('/hostlist', function(req,res) {
  var user = req.session.user || {permission : 1};
  var isSuper = user.permission == 8 ? true : false;
  var html = '';
  res.render('./host/hostlist',{
    message : html,
    user : user.name,
    cname : user.cname,
    title : titleMsg.getTitle('/hostlist'),
    sidemsg : 'var side =' + portal.getSide(user.permission),
    currentmsg : 'var currentUrl = "/lms/page/hostlist"'
  });  
})

module.exports = router;
