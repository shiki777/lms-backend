  $(document)
    .ready(function() {

      $.fn.form.settings.rules.samepasword = function() {
        return $('#pw').val() == $('#pw2').val();
      };

      $('.ui.form')
        .form({
          fields: {
            name: {
              identifier  : 'name',
              rules: [
                {
                  type   : 'empty',
                  prompt : '用户名不能为空'
                },
                {
                  type : 'email',
                  prompt : '请输入正确的邮箱格式'
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
            },
            password2: {
              identifier  : 'password2',
              rules: [
              {
                type   : 'samepasword',
                prompt : '请输入相同的密码'
              }
              ]
            }
          },
          onSuccess : function() {
            var url = window.hosturl + '/lms/admin/register';
            Vue.http.post(url,{username : $('#username').val(), pwd : $('#pw').val()})
            .then(function(data) {
                if(data.body.code == 0){
                    $('.ui.modal')
                    .modal('show'); 
                    setTimeout(function() {
                      window.location.reload();
                    },1000)
                } else {
                    alert('注册失败请重试');
                }
            }, function(e) {
                alert('注册失败');
            })               
            return false;
          }
        })
      ;
    })
  ;