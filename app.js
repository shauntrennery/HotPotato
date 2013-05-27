var Express = require('express'),
  LessMiddleware = require('less-middleware'),
  Routes = require('./routes'),
  Game = require('./lib/game'),
  Config = require('./lib/config'),
  Utils = require('./lib/utils'),
  Util = require('util'),
  _ = require('lodash');

var app = Express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);

// config
var oneYear = 31557600000;
app.use(LessMiddleware({src: __dirname + '/public', compress: true}));
app.use(Express.static(__dirname + '/public', {maxAge: oneYear}));
app.use(Express.bodyParser());
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(Express.cookieParser());
app.use(require("gzippo").compress());

// locals
app.use(function(req, res, next) {
  res.locals.req = req;
  res.locals.user = req.user || false;
  res.locals.utils = Utils;
  res.locals.config = Config;
  res.locals._ = _;

  next();
});

// router
app.use(app.router);

// socket io
io.sockets.on('connection', Game.init);

// generic errors
app.use(function(err, req, res, next) {
  Util.log(Util.inspect(err));

  Utils.render500(req, res, err);
});

Routes.init(app);

var port = process.env.PORT || Config.express.port;
server.listen(port, function() {
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});