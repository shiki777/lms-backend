(function() {

var id = 1;

var vm = new Vue({
    el : '#page',
    data : {
        name : '',
        order : 1,
        price : 100,
        desc : '',
        thumb : '',
        icon : '',
        dependencyCharge : 1,
        chargeStrategy  : [{
            discount : 0.9,
            duration : 3,
            id : getId()
        }],
        onlineRatio : 1
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
            var url = window.hosturl + '/lms/channel/add';
            var self = this;
            Vue.http.post(url,this.formatData())
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show'); 
                     location.href= '/lms/page/channellist';
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
                charge : parseInt(this.dependencyCharge,10) ? true : false,
                order : this.order,
                icon : this.getIcon(),
                chargeStrategy : this.getChargeStrategy()
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