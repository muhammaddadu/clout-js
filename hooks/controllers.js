/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/controllers'),
	utils = require('../lib/utils'),
	express = require('express'),
	router = express.Router();

module.exports = {
	initialize: {
		event: 'start',
		priority: 'CONTROLLER',
		fn: function (next) {
			var self = this;
			function loadController(dir) {
				var name = dir.split('controllers/')[1].replace('.js', '');
				debug('loading controller %s', name);
				var controller = require(filePath);

				if (!controller.path) { return; }
				var hooks = controller.hooks || [],
					method = controller.method ? controller.method.toLowerCase() : 'all';

				// log endpoint request
				router[method](controller.path, function (req, res, next) {
					req.logger.info('Endpoint [%s] %s', req.method, req.path);
					debug('Endpoint [%s] %s', req.method, req.path);
					next();
				});

				// load hook first
				hooks.forEach(function (hook) {
					router[method](controller.path, function (req) {
						hook.name && debug('hook:', hook.name);
						hook.apply(this, arguments);
					}); 
				});

				// load controller
				if (controller.fn) {
					debug('loaded endpoint [%s] %s', method, controller.path);
					router[method](controller.path, function (req) {
						debug('loading controller %s:%s', name);
						controller.fn.apply(this, arguments);
					});
				}
			}

			function loadControllersFromDirectory(dir) {
				var deferred = Q.defer(),
					dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
				dirs.forEach(loadController);
				deferred.resolve();
				return deferred.promise;
			}

			debug('loading controllers');
			// 1) load module controllers
			async.each(this.modules, function (module, next) {
				loadControllersFromDirectory(path.join(module.path, 'controllers')).then(function () {
					next(null);
				}, next);
			}, function done(err) {
				if (err) { throw new Error(err); }
				// 2) load application controllers
				loadControllersFromDirectory(path.join(self.rootDirectory, 'controllers')).then(function () {
					debug('attached router');
					self.app.use('/', router);
					next();
				}, next);
			});
		}
	}
};
