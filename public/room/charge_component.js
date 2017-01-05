Vue.component('charge',{
    template : '<div class="inline" :cid="id">\
                    <span class="charge-span">购买</span>\
                    <input type="number" class="charge-input-duration" v-model="d"/>\
                    <span class="charge-span">个月打</span>\
                    <input class="charge-input-money" v-model="m"/>\
                        <span class="charge-span">折</span>\
                        <div class="negative ui button delete-btn" v-on:click="remove"> <i class="minus icon delete-icon"></i>删除</div>\
                </div>',
    props : ['discount','duration', 'id'],
    data : function() {
        return {
            m : this.discount || 0.8,
            d : this.duration || 3
        }
    },
    methods : {
        remove : function() {
            this.$el.remove();
            this.$emit('remove',{id : this.id});
            this.$destroy();
        }
    }
});
