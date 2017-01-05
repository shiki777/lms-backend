  $(document)
    .ready(function() {

      $('.ui.form')
        .form({
          fields: {
            name: {
              identifier  : 'name',
              rules: [
                {
                  type   : 'empty',
                  prompt : '用户名不能为空'
                }
              ]
            },
            password: {
              identifier  : 'password',
              rules: [
                {
                  type   : 'empty',
                  prompt : '密码不能为空'
                },
                {
                  type   : 'length[6]',
                  prompt : '密码至少需要6位'
                }
              ]
            }
          },
          onSuccess : function() {
            var url = 'http://192.168.5.48:3000/lms/login';
            var username = $('#username').val();
            var pwd = $('#pwd').val();
            var body = {
              username : username,
              pwd : pwd
            };
            Vue.http.post(url,body)
            .then(function(data) {
                if(data.body.code == 0){
                    // location.href= '';
                } else {
                    alert('提交失败：' + data.body.msg);
                }

            }, function(e) {
                alert('提交失败');
            })               
            return false;
          }
        })
      ;
    })
  ;