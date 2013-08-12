var fs = require('fs'),
    config = require('../config.json');

module.exports = function(req, res){
    configStr = '';
    fs.readFile(config.cellSiteConfigFile, function read(err, data) {
        if(!err) {
            res.send(data+'');
        }else{
            res.send('could not read config', 500);
        }
    });
};