(function() {

var id = 1;
var channelid = window.location.search.match(/id=(.*)/) ? window.location.search.match(/id=(.*)/)[1] : 0;
loadRoomInfo(channelid);

function getId() {
    return id++;
}

function loadRoomInfo(id) {
    var url = window.hosturl + '/lms/channel/get';
    Vue.http.jsonp(url,{params : {id : id}})
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
    console.log(discount)
    return {
        name : data.name,
        order : data.order,
        price : data.chargeStrategy.price,
        desc : data.desc,
        thumb : data.thumb,
        icon : data.icon,
        dependencyCharge : data.charge ? 1 : 0,
        chargeStrategy  : discount,
        channelid : channelid,
        defaultRoom : data.defaultRoom || 0
    }
}

function createVm(data) {
var vm = new Vue({
    el : '#page',
    data : data,
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
            var url = window.hosturl + '/lms/channel/update';
            var self = this;
            Vue.http.post(url,this.formatData(),{params : {id : channelid}})
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show'); 
                    // location.href= '';
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
                thumb : this.getThumb(),
                desc : this.desc,
                charge : parseInt(this.dependencyCharge,10) ? 1 : 0,
                order : this.order,
                icon : this.getIcon(),
                chargeStrategy : this.getChargeStrategy(),
                defaultRoom : this.getDefaultRoom()
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
        getIcon : function() {
            return this.$refs.iconcom.imgurl;
        },
        getDefaultRoom : function() {
            return this.$refs.defaultroom.room || null;
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