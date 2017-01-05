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
            var url = '';
            // Vue.http.post(url,{body : this.formatData()})
            // .then(function(data) {
            //     if(data.body.code == 0){
            //         $('.ui.modal')
            //         .modal('show'); 
            //         // location.href= '';
            //     } else {
            //         alert('提交失败：' + data.body.msg);
            //     }

            // }, function(e) {
            //     alert('提交失败');
            // })               
            return false;
          }
        })
      ;
    })
  ;