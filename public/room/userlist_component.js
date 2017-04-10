Vue.component('userselect', {
    template : '<select multiple="multiple" v-model="userids"><option v-for="user in users" :value="user.id">{{user.name}}</option></select>',
    data : function() {
        return {
            userids : [], //选中的用户
            users : [], //可选择用户
            userMap :{} //用户id名字映射表
        }
    },
    beforeCreate : function() {
        var self = this;
        var url = window.hosturl + '/lms/user/list';
        Vue.http.jsonp(url,{params : {}})
            .then(function(data) {
                if(data.body.code == 0){
                    self.users = self.formatUsers(data.body.list);
                    self.userMap = self.getMap(data.body.list);
                } else {
                    alert('用户列表读取失败！');
                    console.log(data.body.msg);
                }
                
            })
    },
    methods : {
        formatUsers : function(arr) {
            var res = [];
            arr.map(function(item) {
                res.push({
                    id : item.id,
                    name : item.name
                });
            })
            return res;
        },
        getMap : function(arr) {
            var res = {};
            arr.map(function(k) {
                res[k.id] = k.name;
            });
            return res;
        },
        /*从users移除选中用户并清空选中用户*/
        updateSelected : function() {
            var self = this;
            this.userids.map(function(k) {
                self.removeListUser(k);
            });
            this.resetSelectUser();
        },
        addListUser : function(user) {
            this.users.push(user);
        },
        removeListUser : function(id) {
            var self = this;
            this.users.map(function(k,i) {
                if(k.id == id){
                    self.users.splice(i,1);
                }
            })
        },
        resetSelectUser : function() {
            this.userids = [];
        },
        getSelectedUsers : function() {
            var users = [];
            var self = this;
            this.userids.map(function(k) {
                users.push({
                    id : k,
                    name : self.userMap[k]
                });
            });
            return users;
        }
    }
})