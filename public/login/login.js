  $(document)
    .ready(function() {
      var l = Vue.config.lang;
      var vm = new Vue({
        i18n : i18n,
        el : '#page',
        data : {
          ep : window.messages[l].message.userNmae,
          pp : window.messages[l].message.pw
        }
      });

      $('.ui.form')
        .form({
          fields: {
            name: {
              identifier  : 'name',
              rules: [
                {
                  type   : 'empty',
                  prompt : window.messages[l].message.emptyUser
                }
              ]
            },
            password: {
              identifier  : 'password',
              rules: [
                {
                  type   : 'empty',
                  prompt : window.messages[l].message.epmtyPw
                },
                {
                  type   : 'length[5]',
                  prompt : window.messages[l].message.pw6
                }
              ]
            }
          },
          onSuccess : function() {
            var url = window.hosturl + '/lms/login';
            var username = $('#username').val();
            var pwd = $('#pwd').val();
            var body = {
              username : username,
              pwd : pwd
            };
            Vue.http.post(url,body)
            .then(function(data) {
                if(data.body.code == 0){
                    location.href= window.hosturl + '/lms/page/index';
                } else {
                    alert(data.body.msg);
                }

            }, function(e) {
                alert('登录失败');
            })               
            return false;
          }
        })
      ;
    })
  ;