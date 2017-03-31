/*获得页面title管理脚本*/

var lang = require('../config/config').lang;

var titleCN = {
    '/login' : '登录',
    '/index' : '首页',
    '/register' : '主播注册',
    '/channelcreate' : '创建频道',
    '/channelupdate' : '频道修改',
    '/channellist' : '频道列表',
    '/roomcreate' : '创建房间',
    'roomupdate' : '房间修改',
    '/roomlist' : '房间列表',
    '/videocreate' : '创建视频',
    '/videoupdate' : '视频更新',
    '/videolist' : '视频列表',
    '/hostlist' : '主播列表'

};

var titleJP = {
    '/login' : '登録',
    '/index' : 'トップページ',
    '/register' : '実況主登録',
    '/channelcreate' : 'チャンネルを作る',
    '/channelupdate' : 'チャンネルを変える',
    '/channellist' : 'チャンネルリスト',
    '/roomcreate' : '部屋を作る',
    'roomupdate' : '部屋を変える',
    '/roomlist' : '部屋リスト',
    '/videocreate' : 'ビデオを作る',
    '/videoupdate' : 'ビデオを変える',
    '/videolist' : 'ビデオリスト',
    '/hostlist' : '実況主リスト'  
};
var title = {
    'CN' : titleCN,
    'JP' : titleJP
};

function getTitle(url) {
    return title[lang][url];
}

module.exports = {
    getTitle : getTitle
};