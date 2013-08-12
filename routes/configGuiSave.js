var fs = require('fs'),
    config = require('../config.json');

module.exports = function(req, res){
    fs.writeFile(
        config.cellSiteConfigFile,
        req.body.config,
        function write(err, data) {
            if(err) {
                res.send(err);
            }else{
                res.send(0);
            }
        }
    );
};