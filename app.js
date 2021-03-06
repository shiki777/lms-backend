var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var multer = require('multer');
var multerupload = multer({ dest: './upload' });
var log4js = require('log4js');
var errorLogger = log4js.getLogger('error');
var missLogger = log4js.getLogger('404');

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
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(log4js.connectLogger(log4js.getLogger('http'), { level: log4js.levels.INFO }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload',express.static(path.join(__dirname, 'upload')));
app.use('/views',express.static(path.join(__dirname, 'views')));


var gmsrouter = require('./routes/gms');
var lms = require('./routes/lms');
var page = require('./routes/page');
var upload = require('./routes/upload');
var video = require('./routes/video');
var thirdApi = require('./routes/third_api');

app.use('/gms', gmsrouter);
app.use('/lms',lms);
app.use('/lms',video);
app.use('/',thirdApi);
app.use('/lms/page',page);
app.use('/lms/upload',multerupload.any(),upload);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  missLogger.info(req.originalUrl);
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  errorLogger.info(err);
  res.render('./error', {
    message: err.message,
    error: {},
    title : '错误页',
    cname : '',
    user : ''
  });
});

module.exports = app;
