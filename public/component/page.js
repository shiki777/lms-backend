Vue.component('pagination', {
    template : '<ul class="pagination"><li v-for="n in page" :class="isCurrent(n)" @click="onPageClick"><a :page="n" href="javascript:void(0)">{{n}}</a></li></ul>',
    props : ['url','size'],
    data : function() {
        return {
            page : 10,
            currentPage : 1,
            pageSize : this.size || 12
        }
    },
    methods : {
        load: function() {
            var self = this;
            var url = this.url;
            /*配合后台，第一页是1*/
            Vue.http.jsonp(url, {
                    params: {page : this.currentPage,pageSize : this.pageSize}
                })
                .then(this.onDataLoaded, this.onLoadFail);
        },
        isCurrent : function(n) {
            return n == this.currentPage ? 'active' : '';
        },
        onPageClick : function(e) {
            var page = parseInt(e.target.getAttribute('page'));
            this.currentPage = page;
            this.load()
        },
        onDataLoaded: function(data) {
            if (data.body.code == 0) {
                this.page = Math.ceil(data.body.data.count / this.pageSize);
                this.$emit('dataloaded',{data : data.body.data.list});
            } else {
                alert('频道列表读取失败！');
                console.log(data.body.msg);
            }
        },
        onLoadFail: function(e) {
            alert(e);
        },
        formatData : function() {}
    },
    created : function() {
        this.load();
    }
});