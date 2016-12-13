const config = {
    /*数据库链接地址*/
    db_path : "mongodb://192.168.5.225:27001/EPG",
    db_path : "mongodb://127.0.0.1:27017/vrtvcms",
    /*epgd host 域名/ip*/
    epgd_host : "192.168.5.225",
    epgd_host : "192.168.5.226",
    /*epgd host端口*/
    epgd_port : "3100",
    /*推流系统host*/
    tuiliu_host : "157.255.21.91",
    tuiliu_host : "157.255.21.92",
    /*推流port*/
    tuiliu_port : 1254,
    /*推流path*/
    tuiliu_path : '/programlist',
    /*媒资host*/
    meizi_host : '58.247.47.106', 
    /*媒资port*/ 
    meizi_port : 9998,
    /*媒资path*/
    meizi_path : '/programming/file/add',
    notAuth : true,
    cms_host : 'http://epg.readyvr.woniucloud.com/',
    cms_host : 'http://127.0.0.1:3000/'
}

module.exports = config;