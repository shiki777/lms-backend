(function() {

var id = 1;
var roomid = window.location.search.match(/id=(.*)/) ? window.location.search.match(/id=(.*)/)[1] : 0;
loadRoomInfo(roomid);

function getId() {
    return id++;
}

function loadRoomInfo(id) {
    var url = window.hosturl + '/lms/room/get';
    Vue.http.jsonp(url,{params : {id : roomid}})
    .then(function(data) {
        if(data.body.code == 0){
            var vmdata = formatRoomData(data.body.data);
            createVm(vmdata);
        } else {
            alert('房间信息加载失败，请重试!');
            console.log(data.body.msg);
        }

    })
}

function formatRoomData(data) {
    var discount = [];
    if(data.chargeStrategy.discount.length >0){
        data.chargeStrategy.discount.map(function(item) {
            discount.push({
                discount : item.discount,
                duration : item.month,
                id : getId()
            })
        })
    }
    return {
        name : data.name,
        order : data.order,
        tag : data.tag,
        users : data.users,
        price : data.chargeStrategy.price,
        desc : data.desc,
        thumb : data.thumb,
        u3dbg : data.u3dbg,
        dependencyCharge : data.dependencyCharge ? 1 : 0,
        chargeStrategy  : discount,
        onlineRatio : data.onlineRatio,
        channelId : data.channelId,
        living : data.living,
        deleteRoom : 0,
        closeLiving : 0,
        viewAngle : data.viewAngle,
        controlModel : data.controlModel + '',
        projectStyle : data.projectStyle + '',
        eyeStyle : data.eyeStyle + ''
    }
}

function createVm(data) {
var vm = new Vue({
    el : '#page',
    data : data,
    computed : {
        changeShow : function() {
            return parseInt(this.dependencyCharge,10) ? 'block' : 'none';
        },
        closeLivingShow : function() {
            return this.living ? 'block' : 'none';
        },
        roomStatus : function() {
            return this.living ? '正在直播' : '未直播';
        }
    },
    methods : {
        addStrategy : function() {
            this.chargeStrategy.push({
                money : '',
                duration : '',
                unit : '',
                id : getId()
            })
        },
        /*监听收费策略删除，从数据中移除对应数据*/
        onChargeRemove : function(e) {
            this.removeStrategy(e.id);
        },
        submit : function(e) {
            var url = window.hosturl + '/lms/room/update';
            var delurl = window.hosturl + '/lms/room/del'
            var self = this;
            var body = this.formatData();
            /*是否有删除房间标记*/
            if(body.deleteRoom){
                Vue.http.delete(delurl, {params : {id : roomid}})
                    .then(function(data) {
                        if(data.body.code == 0){
                            $('.ui.modal').modal('show');
                    window.setTimeout(function() {
                        location.href= '/lms/page/roomlist';
                    }, 1500);
                        } else {
                            alert('提交失败：' + data.body.msg);
                        }
                    }, function(e) {
                        alert('提交失败');
                        console.log(e)
                    })
                    return;
            }
            /*未删除房间逻辑*/
            Vue.http.post(url,body,{params : {id : roomid}})
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show'); 
                    window.setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                } else {
                    alert('提交失败：' + data.body.msg);
                }

            }, function(e) {
                alert('提交失败');
                console.log(e)
            })           
            return false;
        },
        formatData : function() {
            var res = {
                name : this.name,
                channelId : this.getChannelId(),
                living: this.living ? (parseInt(this.closeLiving,10) ? false : true) : false, //直播时候通过关闭直播间选项来判断，未播时为false
                onlineRatio : this.onlineRatio,
                thumb : this.getThumb(),
                desc : this.desc,
                charge : true,
                dependencyCharge : parseInt(this.dependencyCharge,10) ? true : false,
                order : this.order,
                chargeStrategy : this.getChargeStrategy(),
                u3dbg : this.getU3dBg(),
                tag : this.tag,
                deleteRoom : parseInt(this.deleteRoom,10) ? true : false,
                viewAngle : this.viewAngle,
                controlModel : parseInt(this.controlModel,10),
                projectStyle : parseInt(this.projectStyle,10),
                eyeStyle : parseInt(this.eyeStyle,10)                
            };
            return res;
        },
        getChargeStrategy : function() {
            if(parseInt(this.dependencyCharge,10) == 0){
                return {
                    price : 0,
                    discount : []
                };
            }
            var res = {
                price : this.price,
            }
            discount = [];
            this.$refs.charges.map(function(charge) {
                if(charge.del == true) return;
                discount.push({
                    month : charge.d,
                    discount : parseFloat(charge.m,10)
                });
            })     
            res.discount = discount;       
            return res;
        },
        getThumb : function() {
            return this.$refs.thumbcom.imgurl;
        },
        getU3dBg : function() {
            return this.$refs.u3dcom.imgurl;
        },
        getChannelId : function() {
            return this.$refs.channel.rc;
        },
        onAngelBlur : function(e) {
            var num = e.target.value;
            if(num < 60){
                e.target.value = 60;
            }
            if(num > 130){
                e.target.value = 130;
            }
        },        
        removeStrategy : function(id) {
            /*组件调用destroy后 refs没有同步减少，所以这么做，vue刚使用不熟悉*/
            this.$refs.charges.map(function(charge) {
                if(charge.id == id){
                    charge.del = true;
                }
            })
        }

    }
});    
}


})()