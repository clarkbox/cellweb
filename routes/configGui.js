var winston = require('winston'),
    fs = require('fs'),
    config = require('../config.json');

module.exports = function(req, res){
    configStr = '';
    fs.readFile(config.cellSiteConfigFile, function read(err, data) {
        if(!err) {
            configStr = data;
        }
        res.render('configGui', {configStr : configStr});
    });
};