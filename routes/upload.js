var express = require('express');
var router = express.Router();
var fs = require('fs');
var config = require('../config/config');
router.post('/', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    var files = req.files;
    console.log(files)
    var file;
    for (var key in files) {
        var v = files[key];
        var shufix = v.originalname.match(/\..*/)[0];
        rmFile(v.path, v.path + shufix);
        file = {
            oldpath: v.path + shufix,
            newpath: config.host + '/upload/' + v.filename + shufix,
            mimetype: v.mimetype,
            size: v.size
        };
    }
    res.json(file);
})

function rmFile(oldpath, newpath){
    fs.rename(oldpath, newpath, function(e) {
        if(e < 0){
            console.log(e)
        } else {
        }
    })
}


module.exports = router;