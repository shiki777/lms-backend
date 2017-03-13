var log4js = require('log4js');
var logger = log4js.getLogger('epgd');
var Redis = require("ioredis");
var config = require('../config/config.js');
var debug = require('debug')('epgd/redisClient');

// var redisClient = redis.createClient(config.redis.port, config.redis.host);
var redisClient = new Redis(config.redis);

redisClient.on("error", function(err) {
  debug("redis address ", config.redis.host, config.redis.port);
  logger.info("redis address ", config.redis.host, config.redis.port);
  debug("redis Error " + err);
  logger.error("Error " + err);
});
redisClient.on("end", function(err) {
  debug("redis end ");
  logger.info("redis end ");
});
redisClient.on("ready", function(err) {
  debug("redis address ", config.redis.host, config.redis.port);
  logger.info("redis address ", config.redis.host, config.redis.port);
  debug("redis ready ");
  logger.info("redis ready");
  redisClient.select(config.redis.db, function(err) {
    debug('select redis db number:', config.redis.db);
    logger.info('select redis db number:', config.redis.db);
    if (err) {
      debug(err.message);
      logger.info(err.message);
      //进程退出
      process.exit(0);
    }
  });
});
exports.redisClient = redisClient;
