/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
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
 */
const CORE_PRIORITY = {
	CONFIG: 5,
	MIDDLEWARE: 10,
	MODEL: 15,
	API: 20,
	CONTROLLER: 25
};

/**
 * Clout application
 * @param {path} rootDirectory application directory
 */
function Clout(rootDirectory) {
	var self = this;

	EventEmitter.call(this); // initialize EventEmiiter

	this.rootDirectory = null;
	this.package = null;
	this.config = null;
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

	// set application root directory
	this.rootDirectory = path.resolve(rootDirectory);

	// load application package.json
	var applicationPackagePath = path.join(this.rootDirectory, 'package.json'),
		applicationCloutPath = path.join(this.rootDirectory, 'clout.json');
	fs.existsSync(applicationPackagePath) ? (this.applicationPackage = require(applicationPackagePath)) : debug('package.json not found');
	fs.existsSync(applicationCloutPath) ? _.merge(this.applicationPackage, require(applicationCloutPath)) : debug('clout.json not found');

	// load clout package.json
	this.package = require(path.join(__dirname, '../package.json'));

	process.title = this.applicationPackage.name + ' (Clout-JS v' + this.package.version + ')'	

	// get application module list
	if (this.applicationPackage.modules) {
		this.addModules(this.applicationPackage.modules);
	}
	// get clout module list
	if (this.package.modules) {
		this.addModules(this.package.modules);
	}

	// 1) Load clout configuration
	// 2) load module configuration
	// 3) load application configuration (Overrides module conf)
	this.config = new Config({
		env: process.env.NODE_ENV || 'development' // default env = development
	});
	this.config.loadFromDir(path.join(__dirname, '../resources/conf'));
	this.modules.forEach(function (module) {
		self.config.loadFromDir(path.join(module.path, 'conf'));
	});
	this.config.loadFromDir(path.join(this.rootDirectory, 'conf'));

	// initialize logger
	this.logger = new Logger(this);

	// 1) load core hooks
	// 2) load application hooks
	// 3) load module hooks
	this.loadHooksFromDir(path.join(__dirname, '..'))
		.then(this.loadHooksFromDir(this.rootDirectory))
		.then(function () {
			// load module hooks
			async.each(self.modules, function (module, next) {
				self.loadHooksFromDir(module.path).then(function () {
					next(null);
				}, next);
			}, function done(err) {
				if (err) { throw new Error(err); }
			});
		})
		.catch(function (err) {
			throw new Error(err);
		});
}
util.inherits(Clout, EventEmitter);

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
Clout.prototype.registerHook = function registerHook(event, fn, priority, override) {
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
Clout.prototype.loadHooksFromDir = function loadHooksFromDir(dir) {
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

Clout.prototype.addModules = function (modules) {
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
Clout.prototype.start = function start() {
	this.emit('start');
	var self = this,
		deferred = Q.defer();
	process.nextTick(function () {
		async.eachLimit(self.hooks.start, 1, function (hook, next) {
			try {
				debug('executing', hook.name || hook._name, hook.group);
				hook.apply(self, [next]);
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

/**
 * Stop clout
 * @return {Promise} returns a promise
 */
Clout.prototype.stop = function stop() {
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
Clout.prototype.reload = function reload() {
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

module.exports = Clout;
module.exports.PRIORITY = CORE_PRIORITY;
