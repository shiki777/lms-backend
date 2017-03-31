Vue.component('charge',{
    template : '<div class="inline" :cid="id">\
                    <span class="charge-span">{{$t("message.buy")}}</span>\
                    <input type="number" class="charge-input-duration" v-model="d"/>\
                    <span class="charge-span">{{$t("message.mouth")}}</span>\
                    <input class="charge-input-money" v-model="m"/>\
                        <span class="charge-span">{{$t("message.zhe")}}</span>\
                        <div class="negative ui button delete-btn" v-on:click="remove"> <i class="minus icon delete-icon"></i>{{$t("message.delete")}}</div>\
                </div>',
    props : ['discount','duration', 'id'],
    data : function() {
        return {
            m : this.discount || 8,
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
