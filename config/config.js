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
    database: 'lms'
  },
  push_stream_url:{
    host:'127.0.0.1',
    port:6969,
  },
};

module.exports = config;
