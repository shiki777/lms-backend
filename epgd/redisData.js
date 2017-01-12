var log4js = require('log4js');
var logger = log4js.getLogger("epgd/redisData");
var debug = require('debug')('lms:epgd');
//var client = require('../epgd/redisClient').redisClient;
function epgd(client) {
  this.client = client;
}
//插入默认频道
// //频道信息定义
// {
//   id: xx,//String,频道编号
//   name: xxx,//String,频道名称
//   thumb:xxx,//String,背景图
//   icon: xx,//String,缩略图
//   desc: '测试频道',
//   charge: false,
//   charge_strategy: {
//     price: 10,
//     discount: [{
//       month: 5,
//       discount: 0.75
//     }]
//   },
//   default_room_info:{
//     id:0,
//     name:'测试房间',
//     thumb: xx,//String,背景地址
//     desc: '测试房间',//String,描述
//     charge: false,
//     charge_strategy: {
//        price: 10,
//        discount: [{
//          month: 5,
//          discount: 0.75
//       }]
//     },
//     charge_strategy : {
//	     price : 10,
//	     discount: [{month:5,discount : 0.75}]
//      },
//     living: true,//Boolean,是否在直播
//     online : 100,//Number,在线人数
//     tag : '测试房间',//String,标签
//     u3d_bg : '',//String,u3d图片北京
//     view_angle: 60, //视角:60-130
//     project_style: 0,//投影方式:360-3D-Left-Right(0),360-3D-Up-Down(1),360-2D(2),180-3D-Left-Right(3),180-3D-Up-Down(4),180-2D(5),2D(6)
//     control_model: 0,//控制模式:陀螺仪-0,触摸-1,陀螺仪+触摸-2
//     eye_style: 0 //单目双目,单目-0,双目-1
//   }
// };
epgd.prototype.insertDefaultChannel = function(info) {
  if (!((typeof info == 'object') && info.constructor == Object)) {
    debug("insertDefaultChannel info is not object");
    logger.info("insertDefaultChannel info is not object");
    return -1;
  }
  var key = 'default_channel';
  this.client.set(key, JSON.stringify(info));
  return 0;
};

// 插入频道列表
// //频道列表结构定义
// [{
//     id: xx,//Number,频道编号
//     name:xxx,//String，频道名称
//     thumb:xxx,//String，背景图片地址
//     default_room_info:{
//       id:xxx //Number,房间编号
//     }
// }]
epgd.prototype.insertChannelList = function(list) {
  if (!((typeof list == 'object') && list.constructor == Array)) {
    debug("insertChannelList list is not array");
    logger.info("insertChannelList list is not array");
    return -1;
  }
  var key = 'channellist';
  this.client.set(key, JSON.stringify(list));
  return 0;
};
//插入频道信息,数据格式参见频道信息定义
epgd.prototype.insertChannelInfo = function(info) {
  if (!((typeof info == 'object') && info.constructor == Object)) {
    debug("insertChannelInfo info is not object");
    logger.info("insertChannelInfo info is not object");
    return -1;
  }
  var key = 'channel_' + info.id + '_info';
  this.client.set(key, JSON.stringify(info));
  return 0;
};

//插入频道房间列表
//频道房间列表定义
// [{
//   id: xx, //Number 房间id，标识符
//   name: xxx, //String 房间名
//   thumb:xxx, //String 房间封面
//   desc: '测试房间', //String 房间简介
//   charge: xx, //Boolean 房间是否（独立）收费
//   living: xx //Boolean 房间是否在直播
// }]
epgd.prototype.insertChannelRoomList = function(id, list) {
  if (!((typeof id == 'number') && id.constructor == Number)) {
    debug("insertChannelRoomList idid is not number");
    logger.info("insertChannelRoomList id is not number");
    return -1;
  }

  if (!((typeof list == 'object') && list.constructor == Array)) {
    debug("insertChannelRoomList list is not array");
    logger.info("insertChannelRoomList list is not array");
    return -1;
  }
  var key = 'channel_' + id + '_room_list';
  this.client.set(key, JSON.stringify(list));
  return 0;
};

//插入上下频道,数据格式参见频道信息定义
//up，down的格式为channelinfo，第一个频道的上一个为最后一个频道，最后一个频道的下个为第一个频道
epgd.prototype.insertSwitchChannelInfo = function(id, up, down) {
  if (!((typeof id == 'number') && id.constructor == Number)) {
    debug("insertSwitchChannelInfo id is not number");
    logger.info("insertSwitchChannelInfo id is not number");
    return -1;
  }
  if (!((typeof up == 'object') && up.constructor == Object)) {
    debug("insertSwitchChannelInfo up is not object");
    logger.info("insertSwitchChannelInfo up is not object");
    return -1;
  }
  if (!((typeof down == 'object') && down.constructor == Object)) {
    debug("insertSwitchChannelInfo down is not object");
    logger.info("insertSwitchChannelInfo down is not object");
    return -1;
  }
  var key = 'channel_' + id + '_switch_info';
  var channelSwitchInfo = {
    up: up,
    down: down
  };
  this.client.set(key, JSON.stringify(channelSwitchInfo));
  return 0;
};

/////////////////////////////
//插入频道信息
// {
//   id: xxx, //Number 房间id，标识符
//   name: xx, //String 房间名称
//   thumb: xx, //String 房间封面
//   desc: xxx, //String 房间简介
//   charge: xxx, //Boolean 房间是否收费
//     charge_strategy : {
//	     price : 10,
//	     discount: [{month:5,discount : 0.75}]
//      },
//   living: xx, //Boolean 房间直播状态
//   online: xx, //Number 在线人数
//   tag: xx, //String 标签
//   u3d_bg: xx, //String u3d背景图片
//   view_angle: xx, //视角:60-130
//   project_style: xx, //投影方式:360-3D-Left-Right(0),360-3D-Up-Down(1),360-2D(2),180-3D-Left-Right(3),180-3D-Up-Down(4),180-2D(5),2D(6)
//   control_model: xxx, //控制模式:陀螺仪-0,触摸-1,陀螺仪+触摸-2
//   eye_style: xx ,//单目双目,单目-0,双目-1
// };
epgd.prototype.insertRoomInfo = function(info) {
  if (!((typeof info == 'object') && info.constructor == Object)) {
    debug("insertRoomInfo info is not object");
    logger.info("insertRoomInfo info is not object");
    return -1;
  }
  var key = 'room_' + info.id + '_info';
  this.client.set(key, JSON.stringify(info));
};
//插入房间播放地址，必须是字符串，不接受其他格式
epgd.prototype.insertRoomPlayurl = function(id, url) {
  if (!((typeof id == 'number') && id.constructor == Number)) {
    debug("insertRoomPlayurl id is not number");
    logger.info("insertRoomPlayurl id is not number");
    return -1;
  }
  if (!((typeof url == 'string') && url.constructor == String)) {
    debug("insertRoomPlayurl url is not string");
    logger.info("insertRoomPlayurl url is not string");
    return -1;
  }
  var key = 'room_' + id + '_playurl';
  this.client.set(key, url);
};

//删除房间仅仅删除房间信息和播放地址，但是不能删除频道房间列表中的字段，需要单独修改房间频道列表
epgd.prototype.delRoom = function(id) {
  if (!((typeof id == 'number') && id.constructor == Number)) {
    debug("delRoom id is not number");
    logger.info("delRoom id is not number");
    return -1;
  }
  //删除房间信息
  var key = 'room_' + id + '_info';
  this.client.del(key);
  //删除频道房间播放地址
  key = 'room_' + id + '_playurl';
  this.client.del(key);
};
//删除频道，只删除频道信息，频道房间列表，频道的上下频道，但是无法删除关联此频道的上下频道，需要重新组合,还要注意需要修改默认频道
epgd.prototype.delChannel = function(id) {
  if (!((typeof id == 'number') && id.constructor == Number)) {
    debug("delChannel id is not number");
    logger.info("delChannel id is not number");
    return -1;
  }
  //删除频道信息
  var key = 'channel_' + id + '_info';
  this.client.del(key);
  //删除频道房间列表
  key = 'channel_' + id + '_room_list';
  this.client.del(key);
  //删除此频道上下频道
  key = 'channel_' + id + '_switch_info';
  this.client.del(key);
};
//删除所有数据
epgd.prototype.delAll = function() {
  this.client.flushdb();
};
module.exports = epgd;
