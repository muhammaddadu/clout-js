/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/apis'),
	Q = require('q'),
	path = require('path');
	utils = require('../lib/utils')
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
				var apis = require(dir);
				Object.keys(apis).forEach(function loadApi(apiName) {
					debug('loading api %s:%s', group, apiName);
					var api = apis[apiName];
					if (!api.path) {
						return;
					}
					// allow .ext
					api.path += '(.:acceptType)?';

					var hooks = api.hooks || [],
						method = api.method ? api.method.toLowerCase() : 'all';

					// log endpoint request
					router[method](api.path, function (req, res, next) {
						req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
						debug('Endpoint [%s] /api%s', req.method, req.path);
						next();
					});

					// load hook first
					hooks.forEach(function (hook) {
						if (typeof hook === 'string') {
							// implement smart hooks
							return;
						}
						router[method](api.path, function (req) {
							hook.name && debug('hook:', hook.name);
							hook.apply(this, arguments);
						});
					});

					// load api
					if (api.fn) {
						debug('loaded endpoint [%s] /api%s', method, api.path);
						router[method](api.path, function (req) {
							// allow .ext
							if (req.params.acceptType && ACCEPT_TYPES[req.params.acceptType]) {
								var acceptType = ACCEPT_TYPES[req.params.acceptType];
								debug('acceptType', acceptType);
								req.headers['accept'] = acceptType + ',' + req.headers['accept'];
							};
							debug('loading api %s:%s', group, apiName);
							api.fn.apply(this, arguments);
						});
					}
				});
			}

			function loadAPIsFromDirectory(dir) {
				var deferred = Q.defer(),
					dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
				dirs.forEach(loadAPI);
				deferred.resolve();
				return deferred.promise;
			}

			debug('loading apis');
			// 1) load module hooks
			async.each(this.modules, function (module, next) {
				loadAPIsFromDirectory(path.join(module.path, 'apis')).then(function () {
					next(null);
				}, next);
			}, function done(err) {
				if (err) { throw new Error(err); }
				// 2) load application hooks
				loadAPIsFromDirectory(path.join(self.rootDirectory, 'apis')).then(function () {
					debug('attached router');
					self.app.use('/api', router);
					next();
				}, next);
			});
		}
	}
};
