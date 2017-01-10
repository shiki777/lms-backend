(function() {
    var SHOW_CLASS = 'act';
    var HAS_SON_CLASS = 'haveson';
    var $menu = $('#menu');
    formatMenuObj(window.side, window.currentUrl);
    createMenu(window.side,$menu);
    updateAct();
    handleEvent();
    function handleEvent() {
        $('#sidebar a').on('click', onSideBarClick);
    }

    function onSideBarClick(e) {
        var ele = $(e.currentTarget);
        if(isEleHasNextMenu(ele)){
            toggleMenu(ele.parent());
        } else {
            toggleMenu(ele);
        }
    }

    /*点击菜单是否有下级菜单*/
    function isEleHasNextMenu(ele) {
        if($(ele).hasClass(HAS_SON_CLASS)){
            return true;
        } else {
            return false;
        }
    }

    function toggleMenu(ele) {
        ele.toggleClass(SHOW_CLASS);
    }

    function hasSon(obj) {
        if(obj.son){
            return true;
        }
    }

    function formatMenuObj(side, current) {
        for(var key in side){
            var o = side[key];
            if(o.link == current){
                o.current = true;
                return;
            }
            if(hasSon(o)){
                formatMenuObj(o.son, current);
            }
        }
    }

    /*遍历生成纵向节目单*/
    function createMenu(obj, con) {
        for(var key in obj){
            var o = obj[key];
            var link = o.link ? o.link : 'javascript:void(0);';
            var item = '';
            var nextParent = '';
            /*第一层菜单，特殊处理*/
            if(con == $menu){
                if(hasSon(o)){
                    item = $('<dd></dd>');
                    var titleHTML = createTitleHTML(2,o.name);
                    item.append($(titleHTML));
                    nextParent = item.find('ul');
                } else {
                    var act = o.current ? 'act' : '';
                    item = $('<dd><a class="menu-lv2 ' + act + '" href="' + link + '"><span>' + o.name + '</span></a></dd>');
                }
            } else {
                var level = getLevel(con.parent().attr('class')) + 1;
                if(hasSon(o)){
                    item = $('<li></li>');
                    var titleHTML = createTitleHTML(level,o.name);
                    item.append($(titleHTML));
                    nextParent = item.find('ul');
                } else {
                    var act = o.current ? 'act' : '';
                    var html = '<li><a class="menu-lv' + level + ' ' + act + '" href="' + link + '"><i class="ico-dot"></i><span>' + o.name + '</span></a></li>';
                    item = $(html);
                }
            }
            con.append(item);
            if(hasSon(o)){
                createMenu(o.son,nextParent);
            }
        }
    }

    /*创建标题,用于显示次级菜单的名称*/
    function createTitleHTML(level, name) {
        var dotIconHTMl = level >= 3 ? '<i class="ico-dot"></i>' : '';
        var WarpclassName = 'menu-lv' + level + '-wrap wrapele';
        var className = 'menu-lv' + level;
        var html = '<div class="' + WarpclassName + '">'
        + '<a class="' + className  +' haveson" href="javascript:void(0);">' + dotIconHTMl + '<i class="white-down-icon"></i><span>' + name + '</span></a>'
        + '<ul class="menu-sub"></ul></div>';
        return html;
    }

    function getLevel(str) {
        var r = str.match(/menu-lv([0-9])/);
        if(r){
            return parseInt(r[1],10)
        } else {
            return 2;
        }
    }

    /*创建菜单时从外层到内层渲染菜单，选中状态并未完全更新，从最底层展开选中的列表*/
    function updateAct() {
        $('.act').parents('.wrapele').addClass('act');
    }

})()
