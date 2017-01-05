(function() {

var vm = new Vue({
    el : '#page',
    data : {
        channels : [],
        url : window.hosturl + '/channel/list'
    },
    methods : {
        pageLoaded : function(data) {
            this.channels = this.formatChannels(data.data);
        },
        formatChannels : function(data) {
            var res = [];
            data.map(function(item) {
                res.push({
                  name : item.name,
                  thumb : item.thumb,
                  id : item.id,
                  link : 'http://www.baidu.com?id=' + item.id
                });
            })
            return res;
        }
    }
})

})()