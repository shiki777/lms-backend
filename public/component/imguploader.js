Vue.component('imguploader',{
    template : '<div class="field">\
                <label>{{title}}</label>\
                <img class="ui small image"  v-bind:src="imgurl">\
                <div class="ui primary button upload-btn" v-on:click="selectFile">{{$t("message.image")}}<input accept="image/*" v-on:change="onImageChanged" style="display:none;" type="file"/></div>\
                </div>',
    props : ['title', 'thumb'],
    data : function() {
        return {imgurl : this.thumb}
    },
    methods : {
        selectFile : function(e) {
            if(e.target.tagName.toLowerCase() == 'input') return;
            e.target.children[0].click();
            return;
        },
        onImageChanged : function(e) {
            var formdata = new FormData();
            formdata.append('file', e.target.files[0]);
            this.upload(formdata);
        },
        upload : function(formdata) {
            var url = window.hosturl + '/lms/upload';
            var self = this;
            Vue.http.post(url, formdata)
                .then(function(data) {
                    self.imgurl = self.getImgUrl(data.body);
                }, function(e) {
                    alert('上传失败，请重试');
                })
        },
        getImgUrl : function(data) {
            return data.newpath;
        }
    }
});