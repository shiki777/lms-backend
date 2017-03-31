(function() {

var l = Vue.config.lang;
var id = 9999;
load();


function getId() {
    return id++;
}

function load(id) {
    var url = window.hosturl + '/lms/host/list';
    Vue.http.jsonp(url)
    .then(function(data) {
        if(data.body.code == 0){
            var vmdata = formatRoomData(data.body.list);
            createVm(vmdata);
        } else {
            alert(window.messages[l].message.fail)
            console.log(data.body.msg);
        }

    })
}

function formatRoomData(data) {
    data.sort(function(a,b) {
        return b.roomid - a.roomid;
    });
    data.sort();
    return {
        users : data,
        currentUser : '',
        icode : '',
        newpw : '',
        errmsg : ''
    };
}

function createVm(data) {
var vm = new Vue({
    i18n: i18n,
    el : '#page',
    data : data,
    computed : {
    },
    methods : {
        getLink : function(id) {
            return window.hosturl + '/lms/page/roomupdate?id=' + id;
        },
        sendEmail : function() {
            var url = window.hosturl + '/lms/user/email';
            Vue.http.post(url, {email : this.currentUser.username,name : this.currentUser.username})
            .then(function(body) {
                if(body.data.code == 0){
                     alert(window.messages[l].message.receivesuc);
                } else {
                    if(body.data.msg == 'Internal Server Error.'){
                        alert(window.messages[l].message.receivefail);
                    } else {
                        alert(window.messages[l].message.fail + body.data.msg);
                    }
                    
                }
               
            })
            .catch(function(e) {
                 alert(window.messages[l].message.fail);
            })
        },
        modifyPwd : function(user) {
            this.currentUser = user;
            $('.ui.modal.pop').modal('show');
        },
        submitPwd : function() {
            var self = this;
            var url = window.hosturl + '/lms/user/modifypwd';
            Vue.http.jsonp(url,{params : {
                username : this.currentUser.username,
                pw : this.newpw,
                code : this.icode
            }})
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal.suc').modal('show');
                setTimeout(function() {
                    $('.ui.modal.suc').modal('hide');
                },1500);                     
                } else {
                    self.errmsg = data.body.msg;
                    $('.ui.modal.fail').modal('show');
                    setTimeout(function() {
                        $('.ui.modal.fail').modal('hide');
                    },1500);
                }
            })
            .catch(function(e) {
                self.errmsg = e;
                $('.ui.modal.fail').modal('show');
                setTimeout(function() {
                    $('.ui.modal.fail').modal('hide');
                },1500);                
            })
            this.resetInput();
        },
        resetInput : function() {
            this.icode = '';
            this.newpw = '';
        }
    }
});    
}


})()