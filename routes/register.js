var logger = require('simple-log').init('cellweb');

module.exports = function(req, res){
    var twitter = req.query.twitter;
    var filteredTwitter = '';
    var twitterNotAllowed = '!@#$%^&*()+=~`?<>,.{}[]|\\/:;\'"';
    for(var i= 0, len= twitter.length; i<len; i++){
        var c = twitter[i];
        if(twitterNotAllowed.indexOf(c) === -1){
            filteredTwitter += c;
        }
    }

    var mac = req.query.mac ? req.query.mac.toLowerCase() : '';
    var filteredMac = [];
    var allowedMac = '1234567890abcdef';
    for(var i= 0, len= mac.length; i<len; i++){
        var c = mac[i];
        if(allowedMac.indexOf(c) > -1){
            filteredMac += c;
        }
    }

    if(twitter.length > 100){
        res.send('Twitter handle too large.');
        return;
    }

    if(mac.length > 19 || mac.length < 12){
        res.send('Mac address does not seem valid. must be 12 digits. punctuation not required.');
        return;
    }

    //sloppy seconds anyone?
    //TODO fix this ugly with some regex magic
    var x=1;
    var colMac='';
    for(var i= 0, len= filteredMac.length; i<len; i++){
        var c = filteredMac[i];
        colMac += c;
        if(x===2 && i+1!=len){
            colMac+=':';
            x = 0;
        }
        x++;
    }

    //TODO log much more about client
    logger.log('register: twitter=' + filteredTwitter + ' mac='+ colMac + ' ip='+ req.connection.remoteAddress );

    res.send('');
};
