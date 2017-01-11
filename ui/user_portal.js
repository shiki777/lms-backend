/*服务端渲染首页对象，管理对应权限能看到的页面*/
var rolePage = {
    1 : {
        '房间列表页' : '/lms/page/roomlist'
    },
    2 : {
        '房间列表页' : '/lms/page/roomlist',
        '频道列表页' : '/lms/page/channellist',
        '注册页' : '/lms/page/register',
        '房间创建页' : '/lms/page/roomcreate',
        '频道创建页' : '/lms/page/channelcreate',
        '视频创建页' : '/lms/page/videocreate',
        '视频列表页' : '/lms/page/videolist'
    },
    4 : {
        '房间列表页' : '/lms/page/roomlist',
        '频道列表页' : '/lms/page/channellist',
        '注册页' : '/lms/page/register',
        '房间创建页' : '/lms/page/roomcreate',
        '频道创建页' : '/lms/page/channelcreate',
        '视频创建页' : '/lms/page/videocreate',
        '视频列表页' : '/lms/page/videolist'      
    }
}

function renderPortal(role) {
    var html = '<div class="ui list">';
    var listObj = rolePage[role];
    for(var key in listObj){
        html += '<a class="item" href="' + listObj[key] + '" target="_blank">\
                    <div class="header">' + key + '</div>\
                 </a>'
    }
    html += '</div>';
    return html;
}

function getSide(role) {
    if(role == 1){
        return JSON.stringify({
            z : {
                name : '后台首页',
                link : '/lms/page/index'
            },
            a : {
                name : '房间列表',
                link : '/lms/page/roomlist'
            }
        });
    } else {
        return JSON.stringify({
            z : {
                name : '后台首页',
                link : '/lms/page/index'
            },
            a : {
                name : '频道列表',
                link : '/lms/page/channellist'
            },
            b : {
                name : '频道创建',
                link : '/lms/page/channelcreate'
            },
            c : {
                name : '房间创建',
                link : '/lms/page/roomcreate'
            },
            d : {
                name : '房间列表',
                link : '/lms/page/roomlist'
            },
            e : {
                name : '账户注册',
                link : '/lms/page/register'
            },
            f : {
                name : '视频创建',
                link : '/lms/page/videocreate'
            },
            g : {
                name : '视频列表',
                link : '/lms/page/videolist'
            }
        });
    }
}



module.exports = {
    renderPortal : renderPortal,
    getSide : getSide
};