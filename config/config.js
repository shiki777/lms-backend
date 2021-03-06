var config = {
  lang : 'CN', //目前可选JP,CN,注意大小写
  lms:{
    port:3000
  },
  snail_cloud: {
    host: '192.168.5.233',
    port: 8999,
    apply_playtoken_port : 8104
  },
  /*mysql访问*/
  db_mysql: {
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'lms2',
    multipleStatements : true
  },  
  push_stream: {
    host: '0.0.0.0',
    port: 3010,
  },
  user_system:{
    host:'192.168.5.137',
    port:'3050'
  },
  redis_cluster : false,
  redis: {
    host: '192.168.5.137',
    port: 6379,
    db_number: 14
  },
  redisCluster : [{
  port: 6379,
  host: '10.133.131.253'
}],  
  chatroom:{
    host:'58.247.47.106',
    port: 8166
  },
  host : 'http://127.0.0.1:3000'
};

module.exports = config;
