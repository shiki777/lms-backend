var epgd = require('../epgd/insertRedisData');
var config = require('../config/config');
var mysql = require('mysql');
var q = require('q');
var pool = mysql.createPool(config.db_mysql);//pool具有自动重连机制

function insertDefaultChannel(conn){

}

/*拿符合redis格式的一个频道数据*/
function insertChannel(channelid) {
  getChannelData(channelid)
    .then(function(data) {
      epgd.insertChannelInfo(data);
    })
    .catch(function(e) {
      console.log(e)
    })
}

function getChannelData(channelid){
 var defer = q.defer();
      pool.getConnection(function(err,connection){
        if(err){
          console.log('report redis insertChannel error : ' + err)
          defer.reject(err);
        }
        else {
          console.log('connected as id ' + connection.threadId);
          var sql = 'select channel.id,channel.name,channel.charge,channel.price,channel.icon,channel.thumb,channel.order,channel.desc,channel.defaultRoom,channel_discount.id as id1,channel_discount.amount,channel_discount.discount,room.id as id2,room.name as name1,room.thumb as thumb1,room.u3dbg,room.desc as desc1,room.charge as charge1,room.tag,room.viewAngle,room.price as price1,room.controlModel,room.projectStyle,room.eyeStyle,room_discount.id as id3,room_discount.roomId,room_discount.amount as amount1,room_discount.discount as discount1 from channel,channel_discount,room,room_discount where channel.id = ' + pool.escape(channelid) + ' AND channel_discount.channelId = ' + pool.escape(channelid) + ' AND room.id = channel.defaultRoom AND room_discount.roomId = channel.defaultRoom';
          connection.query(sql, function(err, rows, fields) {
            if(err){
              console.log('report redis insertChannel error : ' + err)
              defer.reject(err);
            }
            else {//查询成功
             var channel = formatChannelInfo(rows);
             defer.resolve(channel);
            }
            connection.release();
          });
        }
      });
      return defer.promise;
}

function insertChannelRoomList(conn,id){

}

function insertRoomInfo(roomId,body){
  var roominfo = {
    id : roomId,
    name : body.name,
    thumb : body.thumb,
    desc : body.desc,
    charge : body.charge,
    charge_strategy : body.chargeStrategy,
    living : body.living,
    online : 100,
    tag : body.tag,
    u3d_bg : body.u3dbg,
    view_angle : body.viewAngle,
    project_style : body.projectStyle,
    control_model : body.controlModel,
    eye_style : body.eyeStyle
  }
  epgd.insertRoomInfo(roominfo);
}

function insertRoomPlayurl(id,url){
  epgd.insertRoomPlayurl(id,url);
}


module.exports = {
  insertDefaultChannel : insertDefaultChannel,
  insertChannel : insertChannel
};


function formatChannelInfo(rows) {
  var channel = {
    id : rows[0].id,
    name : rows[0].name,
    thumb : rows[0].thumb,
    icon : rows[0].icon,
    desc : rows[0].desc,
    charge : rows[0].charge ? true : false,
    charge_strategy : getStrategy(rows),
    default_room_info : {
      id : rows[0].defaultRoom,
      name : rows[0].name1,
      thumb : rows[0].thumb1,
      desc : rows[0].desc1,
      charge : rows[0].charge1 ? true : false,
      charge_strategy : getRoomStrategy(rows),
      living : rows[0].living ? true : false,
      online : 100,
      tag : rows[0].tag,
      u3d_bg : rows[0].u3dbg,
      view_angle : rows[0].viewAngle,
      project_style : rows[0].projectStyle,
      control_model : rows[0].controlModel,
      eye_style : rows[0].eyeStyle
    }
  }
  return channel;
}

function getStrategy(rows) {
  if(!rows[0].charge){
    return {
      price : 0,
      discount : []
    };
  }
  var s = {
    price : rows[0].price,
    discount : []
  };
  var ids= [];
  for(var i = 0; i < rows.length; i++){
    if(ids.indexOf(rows[i].id1) < 0){
      s.discount.push({
        month : rows[i].amount,
        discount : rows[i].discount
      });
       ids.push(rows[i].id1);
    }
  }
  return s;
}

function getRoomStrategy(rows) {
  if(!rows[0].charge1){
    return {
      price : 0,
      discount : []
    };
  }
  var s = {
    price : rows[0].price1,
    discount : []
  };
  var ids = [];
  for(var i = 0; i < rows.length; i++){
    if(ids.indexOf(rows[i].id3) < 0){
      s.discount.push({
        month : rows[i].amount1,
        discount : rows[i].discount1
      });
       ids.push(rows[i].id3);
    }
  }
  return s;
}