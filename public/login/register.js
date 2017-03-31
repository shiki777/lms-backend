  $(document)
    .ready(function() {
      var l = Vue.config.lang;
      $.fn.form.settings.rules.samepasword = function() {
        return $('#pw').val() == $('#pw2').val();
      };

      var vm = new Vue({
        i18n : i18n,
        el : '#page',
        data : {
          ep : window.messages[l].message.email1,
          pp : window.messages[l].message.pw,
          p2p : window.messages[l].message.pw2
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
                },
                {
                  type : 'email',
                  prompt : window.messages[l].message.email
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
                  type   : 'length[6]',
                  prompt : window.messages[l].message.pw6
                }
              ]
            },
            password2: {
              identifier  : 'password2',
              rules: [
              {
                type   : 'samepasword',
                prompt : window.messages[l].message.pwsame
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
                    alert(data.body.msg);
                }

            }, function(e) {
                alert(window.messages[l].message.fail);
            })               
            return false;
          }
        })
      ;
    })
  ;