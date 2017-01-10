Vue.component('roomselect', {
    template : '<select v-model="room"><option v-for="room in rooms" :value="room.id">{{room.name}}</option></select>',
    props : ['cid', 'roomid'],
    data : function() {
        return {
            room : this.roomid || 0,
            rooms : []
        }
    },
    created : function() {
        var self = this;
        var url = window.hosturl + '/lms/channel/roomlist';
        Vue.http.jsonp(url,{params : {id: this.cid}})
            .then(function(data) {
                if(data.body.code == 0){
                    self.rooms = self.formatRooms(data.body.data);
                } else {
                    alert('房间列表读取失败！');
                    console.log(data.body.msg);
                }
                
            })
    },
    methods : {
        formatRooms : function(arr) {
            var res = [];
            arr.map(function(item) {
                res.push({
                    id : item.id,
                    name : item.name
                });
            })
            return res;
        }
    }

})