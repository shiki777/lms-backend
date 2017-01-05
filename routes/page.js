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

module.exports = router;
