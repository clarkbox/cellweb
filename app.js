var express = require('express'),
    config = require('./config.json'),
    http = require('http'),
    path = require('path'),
    logger = require('simple-log').init('cellweb'),
    fs = require('fs'),
    ejs = require('ejs');

ejs.open = '{{';
ejs.close = '{{';

function start(){
    var app = express();
    var server = http.createServer(app);

    var index = require('./routes/index.js');
    app.get('/', index);

    var register = require('./routes/register.js');
    app.get('/register', register);

    app.configure(function(){
        app.set('port', config.port);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
    });

    server.listen(app.get('port'), function(){
        logger.log("server listening on port " + app.get('port'));
    });
}

start();