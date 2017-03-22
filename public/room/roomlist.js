(function() {

var vm = new Vue({
    el : '#page',
    data : {
        rooms : {},
        channels : [],
        url : window.hosturl + '/lms/room/list',
        selectChannel : 'all'
    },
    computed : {
        filterChannels : function() {
            if(this.selectChannel == 'all'){
                return this.channels;
            }
            return [this.selectChannel];
        }
    },
    methods : {
        pageLoaded : function(data) {
            formatedData = this.formatRooms(data.data);
            this.rooms = formatedData.rooms;
            this.channels = formatedData.channels;
        },
        formatRooms : function(data) {
            /*对象key需要排序，所以要把频道名字单独排序*/
            var res = {
                rooms :{},
                channels : []
            };
            data.map(function(item) {
                if(!res.rooms[item.cname]){
                    res.rooms[item.cname] = [];
                    res.channels.push(item.cname);
                }
                res.rooms[item.cname].push({
                  name : item.name,
                  thumb : item.thumb,
                  living : item.living,
                  user : item.user,
                  id : item.id,
                  cname : item.cname,
                  link : window.hosturl + '/lms/page/roomupdate?id=' + item.id
                });
            })
            return res;
        },
        onDeleteBtnClick : function(e) {
            e.preventDefault();
            var ele = e.target;
            var id = ele.getAttribute('roomid');
            var self = this;
            if(id){
                var url = window.hosturl + '/lms/room/del';
                Vue.http.delete(url,{params : {id : id}})
                .then(function(data) {
                    if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show');                         
                        self.deleteRoom(id);
                    } else {
                        if(data.body.code ==3){
                            alert('删除失败，该房间是频道默认房间，请先修改对应频道的默认房间！')
                        } else {
                            alert('删除失败 : ' + data.body.msg);
                        }
                    }
                }, function(e) {
                    alert('网络原因删除失败，请重试!');
                });
            }
        },
        onCloseBtnClick : function(e) {
            var url = window.hosturl + '/lms/room/closeliving';
            var body = {
                living : 0
            };
            e.preventDefault();
            var ele = e.target;
            var id = ele.getAttribute('roomid');
            var self = this;   
            Vue.http.post(url,body,{params : {id : id}})
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show'); 
                    this.updateRoom(id);
                } else {
                    alert('提交失败：' + data.body.msg);
                }

            }, function(e) {
                alert('网络原因关闭失败，请重试');
            });      
            this.updateRoom(id);
        },
        deleteRoom : function(id) {
            var index = getIndex(this.rooms, id);
            this.rooms.splice(index, 1);
        },
        updateRoom : function(id) {
            var index = getIndex(this.rooms, id);
            this.rooms[index].living = false;        
        }
    }
})

function getIndex(arr, id) {
    for(var i = 0; i < arr.length; i++){
        if(arr[i].id == id){
            return i;
        }
    }
    return -1;
}

})()