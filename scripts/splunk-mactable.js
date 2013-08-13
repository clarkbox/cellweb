#!/usr/bin/node

/**
 * this is a simple script to take the csv output by splunk, translate to json, and save to the right spot.
 *
 * this all needs to be replaced. should be using the splunkd API, and not a scheduled search with outputcsv command.
*/

var config = require('../config.json'),
    logger = require('simple-log').init('splunk-mactable'),
    fs = require('fs');

fs.readFile(config.macTableCsvPath, function(err, data){
    if(err){
        logger.error('could not read mac table file', err);
    }else{
        //TODO i am sure there is a better way/lib to do the following
        var result = [];
        var lines = (data+'').split(/\n/);
        for(var i=1,len=lines.length;i<len;i++){
            var line = lines[i].split(',');
            var fields = (line+'').split(',');
            var json = {};
            json[fields[0]] = fields[1];
            result.push(json);
        }
        fs.writeFile(config.macTableJsonPath, JSON.stringify(result));
    }
});