/*服务端渲染首页对象，管理对应权限能看到的页面*/

var LANG = {
    cn : 'CN',
    jp : 'JP'
};

var lang = LANG['jp']

var rolePageCN = {
    1 : {
        '房间列表页' : '/lms/page/roomlist',
        '登出' : '/lms/page/login'
    },
    2 : {
        '房间列表页' : '/lms/page/roomlist',
        'チャンネルリスト页' : '/lms/page/channellist',
        '注册页' : '/lms/page/register',
        '房间创建页' : '/lms/page/roomcreate',
        '频道创建页' : '/lms/page/channelcreate',
        '视频创建页' : '/lms/page/videocreate',
        '视频列表页' : '/lms/page/videolist',
        '主播列表页' : '/lms/page/hostlist',
        '登出' : '/lms/page/login'
    },
    4 : {
        '房间列表页' : '/lms/page/roomlist',
        '频道列表页' : '/lms/page/channellist',
        '注册页' : '/lms/page/register',
        '房间创建页' : '/lms/page/roomcreate',
        '频道创建页' : '/lms/page/channelcreate',
        '视频创建页' : '/lms/page/videocreate',
        '视频列表页' : '/lms/page/videolist',
        '主播列表页' : '/lms/page/hostlist',
        '登出' : '/lms/page/login'    
    }
};

var rolePageJP = {
    1 : {
        '部屋リスト' : '/lms/page/roomlist',
        'おかげで' : '/lms/page/login'
    },
    2 : {
        '部屋リスト' : '/lms/page/roomlist',
        'チャンネルリスト' : '/lms/page/channellist',
        '実況主登録' : '/lms/page/register',
        '部屋を作る' : '/lms/page/roomcreate',
        'チャンネルを作る' : '/lms/page/channelcreate',
        'ビデオを作る' : '/lms/page/videocreate',
        'ビデオリスト' : '/lms/page/videolist',
        '実況主リスト' : '/lms/page/hostlist',
        'おかげで' : '/lms/page/login'
    },
    4 : {
        '部屋リスト' : '/lms/page/roomlist',
        'チャンネルリスト' : '/lms/page/channellist',
        '実況主登録' : '/lms/page/register',
        '部屋を作る' : '/lms/page/roomcreate',
        'チャンネルを作る' : '/lms/page/channelcreate',
        'ビデオを作る' : '/lms/page/videocreate',
        'ビデオリスト' : '/lms/page/videolist',
        '実況主リスト' : '/lms/page/hostlist',
        'おかげで' : '/lms/page/login'    
    }
};
var rolePage = {
    'CN' : rolePageCN,
    'JP' : rolePageJP
};

function renderPortal(role) {
    var html = '<div class="ui list">';
    var listObj = rolePage[lang][role];
    for(var key in listObj){
        html += '<a class="item" href="' + listObj[key] + '" target="_blank">\
                    <div class="header">' + key + '</div>\
                 </a>'
    }
    html += '</div>';
    return html;
}

function getSideCN(role) {
    if(role == 1){
        return JSON.stringify({
            z : {
                name : '后台首页',
                link : '/lms/page/index'
            },
            a : {
                name : '房间列表',
                link : '/lms/page/roomlist'
            },
            b : {
                name : '登出',
                link : '/lms/page/login'
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
            },
            h : {
                name : '主播列表',
                link : '/lms/page/hostlist'
            },
            i : {
                name : '登出',
                link : '/lms/page/login'
            }            
        });
    }
}

function getSideJP(role) {
    if(role == 1){
        return JSON.stringify({
            z : {
                name : 'トップページ',
                link : '/lms/page/index'
            },
            a : {
                name : '部屋リスト',
                link : '/lms/page/roomlist'
            },
            b : {
                name : 'おかげで',
                link : '/lms/page/login'
            }            
        });
    } else {
        return JSON.stringify({
            z : {
                name : 'トップページ',
                link : '/lms/page/index'
            },
            a : {
                name : 'チャンネルリスト',
                link : '/lms/page/channellist'
            },
            b : {
                name : 'チャンネルを作る',
                link : '/lms/page/channelcreate'
            },
            c : {
                name : '部屋を作る',
                link : '/lms/page/roomcreate'
            },
            d : {
                name : '部屋リスト',
                link : '/lms/page/roomlist'
            },
            e : {
                name : '実況主登録',
                link : '/lms/page/register'
            },
            f : {
                name : 'ビデオを作る',
                link : '/lms/page/videocreate'
            },
            g : {
                name : 'ビデオリスト',
                link : '/lms/page/videolist'
            },
            h : {
                name : '実況主リスト',
                link : '/lms/page/hostlist'
            },
            i : {
                name : 'おかげで',
                link : '/lms/page/login'
            }            
        });
    }
}


var getSideObj = {
    'CN' : getSideCN,
    'JP' : getSideJP
};

function getSide(role) {
    return getSideObj[lang](role);
}



module.exports = {
    renderPortal : renderPortal,
    getSide : getSide
};