Vue.component('channelselect', {
    template : '<select v-model="rc"><option v-for="item in channels" :value="item.value">{{item.name}}</option></select>',
    props : ['roomchannel'],
    data : function() {
        return {
            rc : this.roomchannel,
            channels : []
        }
    },
    beforeCreate : function() {
        var self = this;
        var url = window.hosturl + '/lms/channel/list';
        Vue.http.jsonp(url,{params : {page : 1,pageSize : 100}})
            .then(function(data) {
                if(data.body.code == 0){
                    self.channels = self.formatChannels(data.body.data.list);
                } else {
                    alert('频道列表读取失败！');
                    console.log(data.body.msg);
                }
                
            })
    },
    methods : {
        formatChannels : function(arr) {
            var res = [];
            arr.map(function(item) {
                res.push({
                    value : item.id,
                    name : item.name
                });
            })
            return res;
        }
    }

})