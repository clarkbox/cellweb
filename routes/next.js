var winston = require('winston');
var appLog = winston.loggers.get('applog');

module.exports = function(req, res){
    var data = '';
    req.on('data', function(chunk){
        data += chunk;
    }).on('end', function(){
        if(data){
            appLog.info('cellsite result', data);
        }
        res.send(getAmac(req.connection.remoteAddress));
    });
};

//very crude way of maintaining some kind of state between cellsites and mac's. a cell site will iterate through the list. when it hits the end, it comes back to the start.
//intentionally not clearing the hostindex dict when the mac table is updated (via pollMacTable()). this should introduce some simple balancing of requests across the mac tables.
//overall this is a temp hack and needs significantly more thought.
var hostindex = {};
function getAmac(host){
    var mac = '00:00:00:00:00:00';
    if(!global.mactable){
        appLog.error('mac table not in memory.');
        return mac;
    }
    var i = hostindex[host] || 0;
    var target = global.mactable[i];
    if(target){
        mac = Object.keys(target)[0] || mac;
        hostindex[host] = i+1;
    }else{
        hostindex[host] = 0;
    }
    return mac;
}