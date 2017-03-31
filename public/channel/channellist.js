(function() {

var l = Vue.config.lang;

var vm = new Vue({
    i18n: i18n,
    el : '#page',
    data : {  
      channels : {},
      tags : [],
      url : window.hosturl + '/lms/channel/list',
      selectTag : 'all'
    },
    computed : {
      tagsFilter : function() {
        if(this.selectTag == 'all'){
          return this.tags;
        }
        return [this.selectTag];
      }
    },
    methods : {
        pageLoaded : function(data) {
            this.channels = this.formatChannels(data.data);
        },
        formatChannels : function(data) {
            var res = {};
            var self = this;
            data.map(function(item) {
              var tag = item.tag || window.messages[l].message.defaulttag;
              if(!res[tag]){
                res[tag] = [];
                self.tags.push(tag);
              }
                res[tag].push({
                  name : item.name,
                  thumb : item.thumb,
                  id : item.id,
                  link : window.hosturl + '/lms/page/channelupdate?id=' + item.id,
                  tag : tag
                });
            });
            return res;
        }
    }
})

})()