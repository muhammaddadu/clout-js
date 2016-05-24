/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/models'),
	utils = require('../lib/utils'),
	Q = require('q'),
	path = require('path');

module.exports = {
	initialize: {
		event: 'start',
		priority: 'MODEL',
		fn: function (next) {
			debug('initialize models');
			this.models = {};
			// append to middleware
			this.app.request.models = this.models;
			next();
		}
	},
	loadModels: {
		event: 'start',
		priority: 18,
		fn: function (next) {
			var self = this;

			function loadModelsFromDir(dir) {
				var deferred = Q.defer(),
					dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
				dirs.forEach(function (dir) {
					var modelName = dir.split('model/')[1].replace('.js', '');
					debug('loading model %s', modelName);
					if (self.models.hasOwnProperty(modelName)) {
						throw new Error('Cannot load model `' + modelName + '` as it already exists');
					}
					self.models[fileName] = require(dir);
				});
				deferred.resolve();
				return deferred.promise;
			}

			debug('loading models');
			// 1) load module hooks
			async.each(this.modules, function (module, next) {
				loadModelsFromDir(path.join(module.path, 'models')).then(function () {
					next(null);
				}, next);
			}, function done(err) {
				if (err) { throw new Error(err); }
				// 2) load application hooks
				loadModelsFromDir(path.join(self.rootDirectory, 'models')).then(function () {
					next();
				}, next);
			});
		}
	}
};
