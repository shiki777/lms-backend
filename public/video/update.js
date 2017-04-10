(function() {

    var id = 1;
    var l = Vue.config.lang;
    var videoid = window.location.search.match(/id=(.*)/) ? window.location.search.match(/id=(.*)/)[1] : 0;
    loadVideoInfo(videoid);

    function getId() {
        return id++;
    }

    function loadVideoInfo(id) {
        var url = window.hosturl + '/lms/video/get';
        Vue.http.jsonp(url, {
                params: {
                    id: id
                }
            })
            .then(function(data) {
                if (data.body.code == 0) {
                    var vmdata = formatVideoData(data.body.data);
                    createVm(vmdata);
                } else {
                    alert('房间信息加载失败，请重试!');
                    console.log(data.body.msg);
                }

            })
    }

    function formatVideoData(data) {
        return {
            name: data.name,
            url: data.downloadurl,
            thumb: data.thumb,
            desc: data.desc,
            order: data.order,
            thumbstr : window.messages[l].message.thumb
        }
    }

    function createVm(data) {
        var vm = new Vue({
            i18n : i18n,
            el: '#page',
            data: data,
            methods: {
                submit: function(e) {
                    var url = window.hosturl + '/lms/video/update';
                    var self = this;
                    Vue.http.post(url, this.formatData(), {
                            params: {
                                id: videoid
                            }
                        })
                        .then(function(data) {
                            if (data.body.code == 0) {
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
                formatData: function() {
                    var res = {
                        name: this.name,
                        url: this.url,
                        thumb: this.getThumb(),
                        desc: this.desc,
                        order: this.order
                    };
                    return res;
                },
                getThumb: function() {
                    return this.$refs.thumbcom.imgurl;
                }
            }
        });
    }


})()