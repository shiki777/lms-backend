(function() {

var vm = new Vue({
    el : '#page',
    data : {
        videoes : [],
        url : window.hosturl + '/lms/video/list'
    },
    methods : {
        pageLoaded : function(data) {
            this.videoes = this.formatVideos(data.data);
        },
        formatVideos : function(data) {
            var res = [];
            data.map(function(item) {
                res.push({
                  name : item.name,
                  thumb : item.thumb,
                  order : item.order,
                  url : item.downloadurl,
                  id : item.id,
                  desc : item.desc,
                  link : window.hosturl + '/lms/page/videoupdate?id=' + item.id
                });
            })
            return res;
        }
    }
})

})()