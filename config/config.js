var config = {
  snail_cloud: {
    host: '192.168.5.233',
    port: 8999
  },
  /*mysql访问*/
  db_mysql: {
    host: '192.168.5.226',
    port: '3306',
    user: 'lms',
    password: 'lms123',
    database: 'lms2',
    multipleStatements : true
  },
  push_stream: {
    host: '0.0.0.0',
    port: 6969,
  },
  user_system:{
    host:'192.168.5.137',
    port:'3050'
  },
  redis: {
    host: '192.168.5.137',
    port: 6379,
    db_number: 5,
  },
  chatroom:{
    host:'192.168.5.137',
    port: 8066
  },
  host : 'http://58.247.47.106:3000'
};

module.exports = config;
