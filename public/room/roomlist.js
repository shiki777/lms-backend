(function() {

var vm = new Vue({
    el : '#page',
    data : {
        rooms : [],
        url : window.hosturl + '/lms/room/list'
    },
    methods : {
        pageLoaded : function(data) {
            this.rooms = this.formatRooms(data.data);
        },
        formatRooms : function(data) {
            var res = [];
            data.map(function(item) {
                res.push({
                  name : item.name,
                  thumb : item.thumb,
                  living : item.living,
                  user : item.user,
                  id : item.id,
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
                var url = window.host + 'http://127.0.0.1:5000/room/list?id=' + id;
                // Vue.http.delete(url)
                // .then(function(data) {
                //     if(data.body.code == 0){
                //         self.deleteRoom(id);
                //     } else {
                //         alert('删除失败 : ' + data.body.msg);
                //     }
                // }, function(e) {
                //     alert('网络原因删除失败，请重试!');
                // });
                this.deleteRoom(id);
            }
        },
        onCloseBtnClick : function(e) {
            var url = 'http://127.0.0.1:5000/room/add';
            var body = {
                living : false
            };
            e.preventDefault();
            var ele = e.target;
            var id = ele.getAttribute('roomid');
            var self = this;   
            // Vue.http.post(url,{body : body,params : {id : id}})
            // .then(function(data) {
            //     if(data.body.code == 0){
            //         $('.ui.modal')
            //         .modal('show'); 
            //         // location.href= '';
            //     } else {
            //         alert('提交失败：' + data.body.msg);
            //     }

            // }, function(e) {
            //     alert('网络原因关闭失败，请重试');
            // });      
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