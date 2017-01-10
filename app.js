var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var multer = require('multer');
var multerupload = multer({ dest: './upload' });

var app = express();
app.use(session({
  secret: 'secret',
  cookie:{
    maxAge: 1000*60*60*24*7
  },
  resave:false,
  saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.engine("html",require("ejs").__express); // or   app.engine("html",require("ejs").renderFile);
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));
app.locals._layoutFile = 'layout.html';

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload',express.static(path.join(__dirname, 'upload')));
app.use('/views',express.static(path.join(__dirname, 'views')));


var gmsrouter = require('./routes/gms');
var lms = require('./routes/lms');
var page = require('./routes/page');
var upload = require('./routes/upload');

app.use('/gms', gmsrouter);
app.use('/lms',lms);
app.use('/lms/page',page);
app.use('/lms/upload',multerupload.any(),upload);

/*假接口 room/info*/
app.get('/room/info', function(req,res) {
  var query = req.query;
  var roomid = query.id ? parseInt(query.id,10) : 1;
  res.jsonp(getData(roomid));
});
/*假接口 视频下载*/
app.get('/videolist', function(req, res) {
  var query = req.query;
  var page = query.page ? parseInt(query.page) : 0;
  var pageSize = query.pageSize ? parseInt(query.pageSize) : 12; 
  var roominfo = {
    name : '房间',
    thumb : 'http://w3.hoopchina.com.cn/82/cc/af/82ccaf82fb2b428b8d64f072625d3339001.jpg',
    desc : 'VR视频',
    downloadurl : 'http://epg.readyvr.woniucloud.com/images/cf90bf4ad41d792ad92700f8d4e7abcc.mp4?name=weidong&passward=snailgame'
  };
  res.jsonp({
    code: 0,
    msg: 'ok',
    data: {
      count: 100,
      list : createRoomList(page,pageSize,roominfo)
    }
  })
});
function getData(id) {
  var imgs = ['http://epg.readyvr.woniucloud.com/mz/cache/snailTV/pagefile/b5e2cfeafe61dca2e0e216d8650bcf6b.png','http://epg.readyvr.woniucloud.com/mz/cache/snailTV/pagefile/937d4c197e98480d0bcd1e599e05d414.png','http://epg.readyvr.woniucloud.com/mz/cache/snailTV/pagefile/1c7978c009ec38788423afa3e80999b5.png'];
  var img = imgs[id%3];
  var titles = ['你好世界','这是网红直播','百家频道正在直播'];
  var title = titles[id%3];
  var popular = id * 33 + parseInt(Math.random()*10000,10);
  return {
    img : img,
    title : title,
    popular : popular
  }
}
function createRoomList(page,size,room) {
  var a = [];
  for(var i = 0; i < size; i++){
    var index = page*size + i + 1;
    a.push({
      name : room.name + index,
      thumb : room.thumb,
      downloadurl : room.downloadurl,
      desc : room.desc
    });
  }
  return a;  
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      title : '错误页'
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    title : '错误页'
  });
});


module.exports = app;
