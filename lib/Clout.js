/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Clout
 * @module clout-js/lib/Clout
 */
const
	debug = require('debug')('clout:core');
	path = require('path'),
	fs = require('fs-extra'),
	EventEmitter = require('events').EventEmitter,
	util = require('util'),
	async = require('async'),
	_ = require('lodash'),
	Q = require('q'),
	utils = require('./utils'),
	Logger = require('./Logger'),
	Config = require('./Config');

/**
 * Priority for core hooks
 * @typedef {(number|string)} priority
 * @property {number} CONFIG 5
 * @property {number} MIDDLEWARE 10
 * @property {number} MODEL 15
 * @property {number} API 20
 * @property {number} CONTROLLER 25
 * @const
 */
const CORE_PRIORITY = {
	CONFIG: 5,
	MIDDLEWARE: 10,
	MODEL: 15,
	API: 20,
	CONTROLLER: 25
};

process.on('unhandledRejection', (err) => {
	console.log(err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
	console.log(err);
    process.exit(1);
});

/**
 * Clout application
 * @class
 */
class Clout extends EventEmitter {
	/**
	 * 
	 * @param {path} rootDirectory application directory
	 */
	constructor(rootDirectory) {
		super();

		this.rootDirectory = null;
		this.package = {};
		this.applicationPackage = {};
		this.config = {};
		this.logger = null;
		this.app = null;
		this.server = {};
		this.modules = [];
		this.moduleCache = [];

		// expose core libraries
		this.utils = utils;
		this.Q = Q;
		this.async = async;
		this._ = _;
		this.fs = fs;

		// allow application hooks (Synchronous)
		this.CORE_PRIORITY = CORE_PRIORITY;
		this.hooks = {
			start: [],
			stop: [],
			reload: []
		};

		// Load clout configuration
		this.config = new Config();
		this.config.loadFromDir(path.join(__dirname, '../resources/conf'));

		this.applicationPackage = {};

		// load clout package.json
		this.package = require(path.join(__dirname, '../package.json'));

		if (rootDirectory) {
			// set application root directory
			this.rootDirectory = path.resolve(rootDirectory);

			// load application package.json
			var applicationPackagePath = path.join(this.rootDirectory, 'package.json');
			var applicationCloutPath = path.join(this.rootDirectory, 'clout.json');

			fs.existsSync(applicationPackagePath)
				? (this.applicationPackage = require(applicationPackagePath))
				: debug('package.json not found');

			fs.existsSync(applicationCloutPath)
				? _.merge(this.applicationPackage, require(applicationCloutPath))
				: debug('clout.json not found');

			process.title = this.applicationPackage.name + ' (Clout-JS v' + this.package.version + ')';

			// get application module list
			if (this.applicationPackage.modules) {
				this.addModules(this.applicationPackage.modules);
			}
		}

		// get clout module list
		if (this.package.modules) {
			this.addModules(this.package.modules);
		}

		// append module configuration
		this.modules.forEach((module) => {
			this.config.loadFromDir(path.join(module.path, 'conf'));
		});

		// append application configuration (Overrides module conf)
		this.config.loadFromDir(path.join(this.rootDirectory, 'conf'));

		// initialize logger
		this.logger = new Logger(this);

		// 1) load core hooks
		// 2) load application hooks
		// 3) load module hooks
		this.loadHooksFromDir(path.join(__dirname, '..'))
			.then(this.loadHooksFromDir(this.rootDirectory))
			.then(() => {
				let deferred = Q.defer();

				// load module hooks
				async.each(this.modules, (module, next) => {
					this.loadHooksFromDir(module.path)
						.then(() => next())
						.catch((err) => {
							console.error(err);
							next();
						});
				}, (err) => {
					if (err) {
						return deferred.reject(err);
					}

					deferred.resolve();
				});

				return deferred.promise;
			})
			.catch(function (err) {
				console.log(err);
			});
	}

	/**
	 * hook into clout runtime
	 * @param {string}   	event 		event name
	 * @param {Function} 	fn    		function to execute
	 * @param {String} 		fn._name    	hook name
	 * @param {String} 		fn.group    hook group
	 * @param {Number}		priority	function priority
	 * @param {Boolean}		override	override existing
	 * @example
	 * // register a function to the hook
	 * clout.registerHook('start', function (next) {
	 * 	next();
	 * });
	 * // invoking an error in clout runtime
	 * clout.registerHook('start', function (next) {
	 * 	next(new Error('Error executing function'));
	 * });
	 */
	registerHook(event, fn, priority, override) {
		debug('registerHook:event=%s:fn:priority=%s', event, priority);
		if (!this.hooks.hasOwnProperty(event)) {
			throw new Error('Invalid Hook Event');
		}

		typeof priority !== 'undefined' && (fn.priority = priority);

		// find existing, override
		if (override === true) {	
			debug('override');
			for (var i = 0, l = this.hooks[event].length; i < l; ++i) {
				var hook = this.hooks[event][i];
				if (hook._name !== null && hook._name === fn._name && hook.group === fn.group) {
					debug('match found, overriden');
					this.hooks[event][i] = fn;
					return;
				}
			}
		}

		// push is no priority
		if (!fn.priority) {
			debug('push hook (no priority)');
			return this.hooks[event].push(fn);
		}

		// find the correct place to register hook
		for (var i = 0, l = this.hooks[event].length; i < l; ++i) {
			var tmp_p = this.hooks[event][i].priority || 99999;
			if (fn.priority < tmp_p) {
				debug('push hook at index %s', String(i));
				return this.hooks[event].splice(i, 0, fn);
			}
		}
		debug('push hook (lowest priority yet)');
		return this.hooks[event].push(fn);
	}

	/**
	 * Loads hooks from directory
	 * @param  {Path} dir directory
	 * @return {Promise}  promise 
	 */
	loadHooksFromDir(dir) {
		var self = this,
			deferred = Q.defer(),
			glob = path.join(dir, '/hooks/**/*.js'),
			files = utils.getGlobbedFiles(glob);

		debug('loadHooksFromDir: %s', dir);
		async.each(files, function (file, next) {
			var hooks = require(file);
			debug('loading hooks from file: %s', String(file));
			var keys = Object.keys(hooks);
			keys.forEach(function (key) {
				debug('Loading hook: %s', key);
				var hook = hooks[key],
					args = [];
				// create args
				if (!hook.event || !hook.fn) {
					throw new Error('Hook missing attributes');
				}
				hook.fn.group = file.split('hooks/')[1].replace('.js', '');
				hook.fn._name = key;
				args.push(hook.event);
				args.push(hook.fn);
				if (typeof hook.priority !== 'undefined') {
					if (typeof hook.priority === 'string') {
						if (!self.CORE_PRIORITY.hasOwnProperty(hook.priority)) {
							throw "Invalid priority type";
						}
						hook.priority = self.CORE_PRIORITY[hook.priority];
					}
					args.push(hook.priority);
				} else {
					args.push(null);
				}
				if (hook.override) {
					args.push(true);
				}
				self.registerHook.apply(self, args);
			});
			next();
		}, function done(err) {
			if (err) {
				debug(err);
				return deferred.reject(err);
			}
			debug('all hooks loaded from %s', dir);
			deferred.resolve();
		});
		return deferred.promise;
	}

	addModules(modules) {
		var self = this;
		debug('found module dependencies', JSON.stringify(this.applicationPackage.modules));
		modules.forEach(function (moduleName) {
			if (!!~self.moduleCache.indexOf(moduleName)) {
				debug('module: %s already loaded', moduleName);
				return;
			}
			debug('loading module: %s', moduleName);
			self.moduleCache.push(moduleName);
			var mod = {
				name: moduleName,
				path: path.dirname(require.resolve(moduleName))
			};
			self.modules.push(mod);
			debug(mod);
			// load module dependencies
			var packagePath = path.join(mod.name, 'package.json'),
				cloutPath = path.join(mod.name, 'clout.json'),
				pkg = {};
			fs.existsSync(packagePath) && _.merge(pkg, require(packagePath));
			fs.existsSync(cloutPath) && _.merge(pkg, require(cloutPath));
			if (pkg.modules) {
				debug('%s loading modules %s', moduleName, pkg.modules);
				self.addModules(pkg.modules);
			}
		});
	}

	/**
	 * Start clout
	 * @return {Promise} returns a promise
	 */
	start() {
		this.emit('start');
		var self = this,
			deferred = Q.defer();
		process.nextTick(function () {
			async.eachLimit(self.hooks.start, 1, function (hook, next) {
				try {
					debug('executing', hook.name || hook._name, hook.group);
					let hookResponse = hook.apply(self, [next]);

					// support promises
					if (typeof hookResponse === 'object') {
						hookResponse.then(next, (err) => next(null, err));
					}
				} catch(e) { console.error(e); }
			}, function (err) {
				if (err) {
					debug(err);
					return deferred.reject(err);
				}
				deferred.resolve();
				self.emit('started');
			});
		});
		return deferred.promise;
	}

	addApi(path, fn) {
		let deferred = Q.defer();

		this.app.use(path, function (req, resp, next) {
			let promiseResponse = fn.apply(this, arguments);

			// support for prmises
			// bind to app.use
			if (String(promiseResponse) === '[object Promise]') {
				promiseResponse
					.then((payload) => {
						switch (Object.prototype.toString.call(payload)) {
							case '[object Object]':
							case '[object String]':
								resp.success(payload);
							break;
							case '[object Undefined]':
							break;
							default:
								console.error('type not supported');
								resp.error('response type is invalid');
							break;
						}
						next();
					})
					.catch((payload) => {
						switch (Object.prototype.toString.call(payload)) {
							case '[object Object]':
							case '[object String]':
								resp.error(payload);
							break;
							case '[object Undefined]':
							break;
							default:
								console.error('type not supported');
								resp.error('response type is invalid');
							break;
						}
						next();
					});
			}
		});

		deferred.resolve();

		return deferred.promise;
	}

	/**
	 * Stop clout
	 * @return {Promise} returns a promise
	 */
	stop() {
		this.emit('stop');
		var self = this;
		var deferred = Q.defer();
		async.eachLimit(this.hooks.stop, 1, function (hook, next) {
			hook.apply(self, [next]);
		}, function (err) {
			if (err) {
				debug(err);
				return deferred.reject(err);
			}
			deferred.resolve();
			self.emit('stopped');
		});
		return deferred.promise;
	}

	/**
	 * Reload clout
	 * @return {Promise} returns a promise
	 */
	reload() {
		var self = this;
		var deferred = Q.defer();
		this.emit('reload');
		this.stop()
			.then(this.start)
			.then(function () {
				deferred.resolve();
			})
			.catch(function (err) {
				slef.emit('reloaded');
				debug(err);
				return deferred.reject(err);
			});
		return deferred.promise;
	}
}

module.exports = Clout;
module.exports.PRIORITY = CORE_PRIORITY;
