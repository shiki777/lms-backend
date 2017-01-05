var express = require('express');
var router = express.Router();
var fs = require('fs');

router.post('/', function(req, res) {
    var files = req.files;
    var fileArr;
    for (var key in files) {
        var v = files[key];
        var shufix = v.originalname.match(/\..*/)[0];
        fileArr = {
            oldpath: v.path,
            newpath: 'upload/' + v.filename + shufix,
            mimetype: v.mimetype,
            size: v.size
        };
    }
    rmFile(fileArr);
    res.header("Access-Control-Allow-Origin", "*");
    res.json(fileArr);
})

function rmFile(oldpath, newpath) {
    fs.rename(oldpath, newpath, function(e) {
        if (e < 0) {} else {}
    })
}