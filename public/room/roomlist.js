(function() {

var l = Vue.config.lang;

var vm = new Vue({
    i18n: i18n,
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
        onDeleteBtnClick : function(channel,e) {
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
                        self.deleteRoom(channel,id);
                    } else {
                        if(data.body.code ==3){
                           alert(window.messages[l].message.deletefail + window.messages[l].message.morenroommodify);
                        } else {
                            alert(window.messages[l].message.deletefail + data.body.msg);
                        }
                    }
                }, function(e) {
                    alert(window.messages[l].message.submit + window.messages[l].message.fail);
                });
            }
        },
        onCloseBtnClick : function(channel,e) {
            var url = window.hosturl + '/lms/room/closeliving';
            var body = {
                living : 0
            };
            var ele = e.target;
            var id = ele.getAttribute('roomid');
            var self = this;   
            Vue.http.post(url,body,{params : {id : id}})
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show'); 
                    this.updateRoom(channel,id);
                } else {
                    alert(window.messages[l].message.submit + window.messages[l].message.fail + data.body.msg);
                }

            }, function(e) {
                alert(window.messages[l].message.submit + window.messages[l].message.fail);
            });      
            this.updateRoom(id);
        },
        deleteRoom : function(channel,id) {
            var index = getIndex(this.rooms[channel], id);
            this.rooms[channel].splice(index, 1);
        },
        updateRoom : function(channel,id) {
            var index = getIndex(this.rooms[channel], id);
            this.rooms[channel][index].living = false;        
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