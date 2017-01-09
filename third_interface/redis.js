var epgd = require('../epgd/insertRedisData');

function insertDefaultChannel(conn){

}

function insertChannel(conn,chid){

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
  insertDefaultChannel : insertDefaultChannel
};
