/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/apis'),
	path = require('path'),
	utils = require('../lib/utils'),
	express = require('express'),
	router = express.Router();

const ACCEPT_TYPES = {
	json: 'application/json',
	html: 'text/html'
};

module.exports = {
	initialize: {
		event: 'start',
		priority: 'API',
		fn: function (next) {
			var self = this;
			function loadAPI(dir) {
				var group = dir.split('apis/')[1].replace('.js', '');
				debug('loading apis from %s', group);
				try {
					var apis = require(dir);
				} catch (e) {
					throw new Error('Error loading api group `' + group + '`: ' + e);
				}
				Object.keys(apis).forEach(function loadApi(apiName) {
					debug('loading api %s:%s', group, apiName);
					var api = apis[apiName];
					if (!api.path) {
						return;
					}
					// allow .ext
					api.path += '\.:acceptType?';

					var hooks = api.hooks || [],
						methods = api.methods
							? api.methods
							: [api.method || 'all'];

					methods = methods.map((method) => method.toLowerCase());

					// log endpoint request
					methods.forEach((method) => router[method](api.path, function (req, res, next) {
						req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
						debug('Endpoint [%s] /api%s', req.method, req.path);
						next();
					}));

					// load hook first
					hooks.forEach(function (hook) {
						if (typeof hook === 'string') {
							// implement smart hooks
							return;
						}
						methods.forEach((method) => router[method](api.path, function (req) {
							hook.name && debug('hook:', hook.name);
							hook.apply(this, arguments);
						}));
					});

					// load api
					if (api.fn) {
						methods.forEach((method) => router[method](api.path, function (req) {
							debug('loaded endpoint [%s] /api%s', method, api.path);
							// allow .ext
							if (req.params.acceptType && ACCEPT_TYPES[req.params.acceptType]) {
								var acceptType = ACCEPT_TYPES[req.params.acceptType];
								debug('acceptType', acceptType);
								req.headers['accept'] = acceptType + ',' + req.headers['accept'];
							};
							debug('loading api %s:%s', group, apiName);
							api.fn.apply(this, arguments);
						}));
					}
				});
			}

			function loadAPIsFromDirectory(dir) {
				var dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
				dirs.forEach(loadAPI);
			}

			debug('loading apis');
			// 1) load module hooks
			this.modules.forEach(function (module) {
				loadAPIsFromDirectory(path.join(module.path, 'apis'));
			});
			// 2) load application hooks
			loadAPIsFromDirectory(path.join(self.rootDirectory, 'apis'));
			// 3) attach router
			debug('attached router');
			self.app.use('/api', router);
			next();
		}
	}
};
