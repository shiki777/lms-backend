var log4js = require('log4js');
var logger = log4js.getLogger("modules/v2/redisClient");
var redis = require("redis");
var config = require('../config/config.js');
var debug = require('debug')('lms:server');

var redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on("error", function(err) {
  debug("redis Error " + err);
  logger.error("Error " + err);
});
redisClient.on("end", function(err) {
  debug("redis end ");
  logger.info("redis end ");
});
redisClient.on("ready", function(err) {
  debug("redis ready ");
  logger.info("redis ready" );
  redisClient.select(config.redis.db_number, function(err){
    debug('select redis db number:',config.redis.db_number);
    logger.info('select redis db number:',config.redis.db_number);
    if (err) {
      debug(err.message);
      logger.info(err.message);
      //进程退出
      process.exit(0);
    }
  });
});
exports.redisClient = redisClient;
