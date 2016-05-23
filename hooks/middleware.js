/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	fs = require('fs-extra'),
	path = require('path'),
	express = require('express'),
	debug = require('debug')('clout:hook/middleware'),
	compress = require('compression')
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session');

module.exports = {
	initialize: {
		event: 'start',
		priority: 1,
		fn: function (next) {
			this.app = express();
			this.app.set('x-powered-by', 'clout-js');
			this.app.set('env', this.config.env);
			// request parsing
			this.app.use(bodyParser.json());
			debug('loaded bodyParser.json()');
			this.app.use(bodyParser.urlencoded({
				extended: false
			}));
			debug('loaded bodyParser.urlencoded()');
			this.app.use(bodyParser.text({}));
			debug('loaded bodyParser.text()');
			this.app.use(bodyParser.raw({}));
			debug('loaded bodyParser.raw()');
			this.app.use(cookieParser());
			next();
		}
	},
	compress: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			debug('appending compression to middleware');
			this.app.use(compress());
			next();
		}
	},
	session: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var sessionConf = this.config.session || {};
			if (!sessionConf.secret) {
				this.logger.warn('session.secret is undefined');
				sessionConf.secret = '1c6bf8c5cef18097a5389c3ca6d73328';
			}
			if (!sessionConf.hasOwnProperty('resave')) {
				sessionConf.resave = true;
			}
			if (!sessionConf.hasOwnProperty('saveUninitialized')) {
				sessionConf.saveUninitialized = false;
			}
			this.config.session = sessionConf;
			this.app.session = session(sessionConf);
			this.app.use(this.app.session);
			next();
		}
	},
	publicFolders: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var self = this;
			function useDir(dir) {
				if (!fs.existsSync(dir)) { return; }
				debug('appending public dir %s', dir);
				self.app.use(express.static(dir));
			}
			// application public folder
			useDir(path.join(this.rootDirectory, 'public'));
			// modules
			this.modules.forEach(function (module) {
				useDir(path.join(module.path, 'public'));
			});
			// clout public folder
			useDir(path.join(__dirname, '../resources/public'));
			next();
		}
	},
	views: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var views = [];
			function useDir(dir) {
				if (!fs.existsSync(dir)) { return; }
				debug('appending views dir %s', dir);
				views.push(dir);
			}
			// application public folder
			useDir(path.join(this.rootDirectory, 'views'));
			// modules
			this.modules.forEach(function (module) {
				useDir(path.join(module.path, 'views'));
			});
			// clout public folder
			useDir(path.join(__dirname, '../resources/views'));
			// set views
			this.app.set('views', views);
			next();
		}
	},
	layoutEngine: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			this.app.set('view engine', 'ejs');
			next();
		}
	},
	response: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var httpResponseMap = this.config.httpResponseMap;
			next();
			// TODO:-
			// - refactor to add support for more file types (CSV, XML)
			// - success: false should point to an error html response
			this.app.use(function (req, resp, next) {
				this.responseType = req.accepts(['json', 'html']);
				if (resp.ok) { return next(); }
				// load responses
				var self = this,
					methods = Object.keys(httpResponseMap);

				methods.forEach(function (methodName) {
					var method = httpResponseMap[methodName];
					resp[methodName] = function (payload) {
						switch (self.responseType) {
							case 'json':
								resp
									.type('json')
									.status(method.code)
									.send(JSON.stringify(_.merge({
										data: payload
									}, {
										code: method.code,
										success: method.method
									})));
							break;
							case 'html':
								resp
									.status(method.code)
									.send(payload)
							break;
							default:
								resp
									.status(method.code)
									.send(payload);
							break;
						} 
					};
				});
				next();
			});
		}
	},
	leastButNotLast: {
		event: 'start',
		fn: function (next) {
			next();
			this.app.use(function (err, req, resp, next) {
				if (!err) { return next(); }
				
				req.logger.error(err.stack);
				resp.error(err);
			});

			// Assume 404 since no middleware responded
			this.app.use(function (req, resp) {
				resp.notFound();
			});
		}
	}
};