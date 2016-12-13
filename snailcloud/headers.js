
var SECRETKEY = '';
/**
 * opt
 * @param {string} opt.body - 请求body.
 * @param {string} opt.method - 请求方法.
 * @param {uri} opt.uri - 请求uri
 */
function setHeader(opt) {
    var opt = opt || {};
    var nonce = getNonce();
    var stamp = getStamp();
    return {
        'Content-type': 'application/json;charset=utf-8',
        'X-woniu-cloud-secretkey' : SECRETKEY,
        'X-woniu-cloud-nonce' : nonce,
        'X-woniu-cloud-timestamp' : stamp,
        'X-woniu-cloud -signature' : createSignature(opt.body,opt.method,opt.uri,SECRETKEY,nonce,stamp)
    }
}

function createSignature(body,method,uri,secretkey,nonce,stamp) {
    var method = method.toLocaleUpperCase();
    var orignalArr = ['body=' + body, 'method=' + method, 'uri=' + uri, 'X-woniu-cloud-secretkey=' + secretkey, 'X-woniu-cloud-nonce=' + nonce, 'X-woniu-cloud-timestamp=' + stamp];
    var orignal = orignalArr.join('&');

    return '';
}

/*获取不重复的随机数*/
function getNonce() {
    return new Date().getTime() + Math.random();
}

/*获取时间戳*/
function getStamp() {
    return Math.round(new Date().getTime()/1000);
}


module.exports = {
    setHeader : setHeader
}