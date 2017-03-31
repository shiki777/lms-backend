(function() {

var id = 1;
var l = Vue.config.lang;

var vm = new Vue({
    i18n : i18n,
    el : '#page',
    data : {
        name : '',
        url : '',
        thumb : '',
        order : 1,
        desc : '',
        thumbstr : window.messages[l].message.thumb
    },
    computed : {
        changeShow : function() {
            return parseInt(this.dependencyCharge,10) ? 'block' : 'none';
        }
    },
    methods : {
        submit : function(e) {
            var url = window.hosturl + '/lms/video/add';
            var self = this;
            Vue.http.post(url,this.formatData())
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show'); 
                    window.setTimeout(function() {
                         location.href= '/lms/page/videolist';
                    }, 1500);
                } else {
                    alert('提交失败：' + data.body.msg);
                }

            }, function(e) {
                alert('提交失败');
            })           
            return false;
        },
        formatData : function() {
            var res = {
                name : this.name,
                url : this.url,
                thumb : this.getThumb(),
                desc : this.desc,
                order : this.order
            };
            return res;
        },
        getThumb : function() {
            return this.$refs.thumbcom.imgurl;
        }
    }
});

function getId() {
    return id++;
}

})()