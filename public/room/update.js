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
                discount : item.discount * 10,
                duration : item.month,
                id : getId()
            })
        })
    } else {
        discount.push({
            discount : 8,
            duration : 3
        });
    }
    return {
        name : data.name,
        order : data.order,
        tag : data.tag,
        users : data.users,
        originUsers : JSON.parse(JSON.stringify(data.users)), //原始用户，用于提交时比较出差异
        price : data.chargeStrategy.price || 100,
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
        eyeStyle : data.eyeStyle + '',
        modifyUser : false
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
                            $('.ui.modal.sub').modal('show');
                    window.setTimeout(function() {
                        location.href= '/lms/page/roomlist';
                    }, 1500);
                        } else {
                        if(data.body.code ==3){
                            alert('删除失败，该房间是频道默认房间，请先修改对应频道的默认房间！')
                        } else {
                            alert('删除失败 : ' + data.body.msg);
                        }
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
                    $('.ui.modal.sub')
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
                charge : parseInt(this.dependencyCharge,10) ? 1 : 0,
                dependencyCharge : parseInt(this.dependencyCharge,10) ? 1 : 0,
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
            if(this.modifyUser){
                res.users = this.getHostDif();
            }
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
                    discount : parseFloat(charge.m,10)/10,
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
        },
        onHostAdd : function() {
            $('.small.modal')
            .modal('show');
        },
        delHost : function(user) {
            if(this.users.length <= 1){
                alert('删除后主播为空，请先增加一位主播再删除！');
                return;
            }
            this.modifyUser = true;
            this.removeUser(user);
        },
        removeUser : function(user) {
            var index = this.getUserIndex(user.id);
            this.users.splice(index,1);
            this.getUserList().addListUser(user);
        },
        getUserIndex : function(id) {
            var index = -1;
            this.users.map(function(v,ind) {
                if(index == -1 && v.id == id){
                    index = ind;
                }
            })
            return index;
        },
        getUserList : function() {
            return this.$refs.userlist;
        },
        resetUserList : function() {
            this.getUserList().resetSelectUser();
        },
        updateUserList : function() {
            this.modifyUser = true;
            var selectedUser = this.getUserList().getSelectedUsers();
            var self = this;
            selectedUser.map(function(v) {
                self.users.push(v);
            })
            this.getUserList().updateSelected();
        },
        /*找出提交时候主播的修改*/
        getHostDif : function() {
            var res = {
                add : [],
                del : []
            };
            var self = this;
            this.users.map(function(u) {
                if(!self.isHostinOrigin(u)){
                    res.add.push(u.id);
                }
            })
            this.originUsers.map(function(u) {
                if(!self.isHostinSelect(u)){
                    res.del.push(u.id);
                }
            });
            return res;
        },
        isHostinOrigin: function(user) {
            var res = false;
            this.originUsers.map(function(u) {
                if(!res && u.id == user.id){
                    res = true;
                }
            });
            return res;
        },
        isHostinSelect: function(user) {
            var res = false;
            this.users.map(function(u) {
                if(!res && u.id == user.id){
                    res = true;
                }
            });
            return res;
        }
    }
});    
}


})()