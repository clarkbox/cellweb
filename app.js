var express = require('express'),
    config = require('./config.json'),
    https = require('https'),
    path = require('path'),
    winston = require('winston'),
    fs = require('fs'),
    ejs = require('ejs'),
    url = require('url'),
    querystring = require('querystring'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy,
    flash = require('connect-flash');

/*START PASSPORT*/
var users = [
    { id: 1, username: 'admin', password: 'changeme' }
];

function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByUsername(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            findByUsername(username, function(err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
                if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
                return done(null, user);
            });
        });
    }
));

passport.use(new BasicStrategy(
    function(username, password, done) {
        findByUsername(username, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
            if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
            return done(null, user);
        })
    }
));
/*END PASSPORT*/

ejs.open = '[[';
ejs.close = ']]';

var accessLog = winston.loggers.add('accesslog', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'access-log'
    },
    file: {
        filename: config.httpAccessLogPath
    }
});

var appLog = winston.loggers.add('applog', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'app-log'
    },
    file: {
        filename: config.appLogPath
    }
});

function pollMacTable(){
    fs.readFile(path.resolve(config.macTableJsonPath), function(err, data){
        if(err){
            winston.log('could not read mactable.json', err);
            setTimeout(pollMacTable, config.macTablePollInterval);
            return;
        }

        try{
            data = JSON.parse(data);
        }catch(e){
            data = {};
        }

        global.mactable = data;
        appLog.info('updated in memory mac table');
        setTimeout(pollMacTable, config.macTablePollInterval);
    });
}

function httplog(req, res, next){
    var parsedUrl = url.parse(req.url);
    console.log(req.url)
    var body = '';
    req.on('data', function(chunk) {
        body += chunk.toString();
    });
    req.on('end', function(){
        var log = {
            timestamp: (new Date()).getTime(),
            url: req.url,
            path: parsedUrl.pathname,
            port: parsedUrl.port,
            headers: req.headers,
            status: res.statusCode,
            method: req.method,
            clientip: req.connection.remoteAddress,
            body: querystring.parse(body),
            bodyraw: body,
            query: querystring.parse(parsedUrl.query),//TODO req.query should do it
            queryraw: parsedUrl.query

        };
        accessLog.info( log );
    });
    next();
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login?to='+req.url);
}

function start(){
    var app = express();
    app.configure(function(){
        app.set('port', config.port);
        app.set('view engine', 'ejs');
        app.set('views', __dirname + '/views');
        app.use(express.static(path.join(__dirname, 'public')));
        app.use(httplog);
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.methodOverride());
        app.use(express.session({ secret: 'keyboard cat' }));
        app.use(flash());
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(app.router);
    });

    //the map interface
    var index = require('./routes/index.js');
    app.get('/', index);

    //endpoint to register a mac address/twitter handle
    var register = require('./routes/register.js');
    app.get('/register', register);

    //just a placeholder endpoint for arbitrary logging into splunk
    var track = require('./routes/track.js');
    app.get('/track', track);
    app.post('/track', track);

    //endpoint for getting and submitting a mac target
    var next = require('./routes/next.js');
    app.post('/next', passport.authenticate('basic', { session: false }), next);

    //the config interface
    var configGui = require('./routes/configGui.js');
    app.get('/config', ensureAuthenticated, configGui);
    //endpoint to save config
    var configGuiSave = require('./routes/configGuiSave.js');
    app.post('/config', ensureAuthenticated, configGuiSave);

    //endpoint returning config
    var getConfig = require('./routes/getConfig.js');
    app.get('/getconfig', passport.authenticate('basic', { session: false }), getConfig);

    app.get('/login', function(req, res){
        res.render('login', { user: req.user, message: req.flash('error'), to: req.query.to });
    });

    app.post(
        '/login',
        passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
        function(req, res) {
            res.redirect(req.query.to || '/');
        }
    );

    app.get(
        '/logout',
        function(req, res){
            req.logout();
            res.redirect('/');
        }
    );

    var server = https.createServer({
        key: fs.readFileSync('/srv/key.pem'),
        cert: fs.readFileSync('/srv/cert.pem')
    }, app);

    server.listen(app.get('port'), function(){
        appLog.info("server listening on port " + app.get('port'));
    });
}

pollMacTable();
start();