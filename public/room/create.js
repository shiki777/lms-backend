(function() {

var id = 1;

var vm = new Vue({
    el : '#page',
    data : {
        name : '',
        order : 1,
        tag : '',
        // userNum : 1,
        price : 100,
        desc : '',
        thumb : '',
        u3dbg : '',
        dependencyCharge : 0,
        chargeStrategy  : [{
            discount : 0.9,
            duration : 3,
            id : getId()
        }],
        onlineRatio : 1,
        channelId : 0,
        viewAngle : 90,
        controlModel : '0',
        projectStyle : '0',
        eyeStyle : '0'
    },
    computed : {
        changeShow : function() {
            return parseInt(this.dependencyCharge,10) ? 'block' : 'none';
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
            var url = window.hosturl + '/lms/room/add';
            var self = this;
            Vue.http.post(url,this.formatData())
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
            })           
            return false;
        },
        formatData : function() {
            var res = {
                name : this.name,
                channelId : this.getChannelId(),
                living: false,
                onlineRatio : this.onlineRatio,
                thumb : this.getThumb(),
                desc : this.desc,
                charge : parseInt(this.dependencyCharge,10) ? 1 : 0,
                dependencyCharge : parseInt(this.dependencyCharge,10) ? 1 : 0,
                order : this.order,
                chargeStrategy : this.getChargeStrategy(),
                u3dbg : this.getU3dBg(),
                // userNum : this.userNum,
                tag : this.tag,
                userid : this.getUserIds(),
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
        getUserIds : function() {
            return this.$refs.userlist.userids;
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

function getId() {
    return id++;
}

})()