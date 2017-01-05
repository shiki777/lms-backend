var express = require('express');
var router = express.Router();
router.get('/login', function(req,res) {
  var isSuper = req.query.reg ? true : false;
  res.render('./login/login',{
    message : 'var isSuper = ' + isSuper,
    title : '登录'
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


router.get('/channelcreate', function(req,res) {
  var user = req.session.user || {};
  var isSuper = user.permission == 8 ? true : false;
  var html = isSuper ? '<a href="/cms/admin/rolemanager" target="_self" id="role-list">权限管理</a>' : '';
  html = '';
  res.render('./channel/create',{
    message : html,
    user : user.name,
    title : '频道创建'
  });
})

module.exports = router;
