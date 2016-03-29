/**
 * Clout Javascript Framework
 */
var async = require('async'),
	express = require('express'),
	_ = require('lodash'),
	utils = require('./lib/utils'),
	debug = require('debug')('clout:base');

var path = require('path'),
	fs = require('fs'),
	https = require('https'),
	emitter = new (require('events').EventEmitter);

var clout = _.merge(emitter, {
	express: express,
	app: express(), // initialize express
	logger: undefined,
	appDir: undefined,
	config: undefined,
	models: undefined,
	server: {
		http: undefined,
		https: undefined
	},
	socket: undefined,
	start: function start(callback) {
		// execute at the end of stack
		process.nextTick(function start() {
			clout.emit('starting');
			async.parallel([
				function modelSync(next) {
					var sequelize = clout.sequelize;
					if (!sequelize) {
						return next();
					}
					// syncronize sequelize
					debug('syncronizing sequelize');
					sequelize.sync(clout.config.sequelize && clout.config.sequelize.sync)
						.then(function () {
							clout.emit('sequelize:synced');
							next();
						}, function (err) {
							debug('sequelize.sync::error:', err);
							next(err);
						});
				},
				// implement port checker
				// https
				function startHttps(done) {
					if (!clout.config.https) {
						return done();
					}
					// port, key, cert
					debug('Securely using https protocol');

					// Create HTTPS Server
					var payload = JSON.parse(JSON.stringify(clout.config.https));
					delete payload.port;
					clout.server.https = https.createServer(payload, clout.app).listen(process.env.SSLPORT || clout.config.https.port || 8443);

					debug('https server started on port %s', clout.server.https.address().port);
					done();
				},
				// http
				function startHttp(done) {
					clout.server.http = clout.app.listen(process.env.PORT || clout.config.http && clout.config.http.port || 8080, function() {
						debug('http server started on port %s', clout.server.http.address().port);
						done();
					});
				}
			], function (err) {
				clout.emit('started');
				callback && callback();
			});
		});
	}
});

// export clout
module.exports = clout;

// initialize
(function initialize() {
	clout.emit('initializing');
	clout.utils = utils;
	debug('initializing');
	module.parent && (clout.appDir = path.dirname(module.parent.filename)); // define application dir
	debug('appDir: %s', clout.appDir);
	clout.appDir && (clout.modulesDir = path.join(clout.appDir, 'modules')) && fs.existsSync(clout.modulesDir) || (clout.modulesDir = null);
	debug('modulesDir: %s', clout.modulesDir);
	clout.config = require('./lib/config'); // load config
	debug('config: %s', JSON.stringify(clout.config));
	(require('./lib/middleware'))(clout); // load custom middleware
	(require('./lib/models'))(clout); // load models
	(require('./lib/logger'))(clout); // load models

	// initialize at the end of the current stack
	process.nextTick(function () {
		(require('./lib/api'))(clout); // load apis
		(require('./lib/controllers'))(clout); // load controllers
		clout.emit('initialized');
		debug('initialized');
	});
})();
