/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	path = require('path'),
	fs = require('fs-extra'),
	_ = require('lodash'),
	utils = require('./utils'),
	debug = require('debug')('clout:config');

/**
 * Creates a configuration object
 * @param {Object} defaultConf default configuration
 */
function Config(defaultConf) {
	debug('initializing config');
	// merge default configuration
	_.merge(this, defaultConf);
	// ensure env is defined
	!this.env && (this.env = 'production');
}

/**
 * Loads configuration
 * @param  {Path} dir directory
 */
Config.prototype.loadFromDir = function loadFromDir(dir) {
	var self = this;
	debug('loading config from dir %s', dir);
	if (!fs.existsSync(dir)) {
		debug('dir does not exist');
		return;
	}

	// load configurations
	var globDefault = '*default.js',
		globEnv = '*' + this.env + '.js';

	// 1) load default configuration
	utils.getGlobbedFiles(path.join(dir, globDefault)).forEach(function (file) {
		debug('loading config from: %s', file);
		_.merge(self, require(file));
	});

	// 2) load env specific configuration
	utils.getGlobbedFiles(path.join(dir, globEnv)).forEach(function (file) {
		debug('loading config from: %s', file);
		_.merge(self, require(file));
	});
}

module.exports = Config;
