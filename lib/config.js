/**
 * Clout Javascript Framework
 * @config
 */

var path = require('path'),
	fs = require('fs'),
	_ = require('lodash'),
	utils = require('./utils'),
	debug = require('debug')('clout:config'),
	clout = require('../');

var config = {
	env: process.env.NODE_ENV || 'development', // default enviroment to development
	sessionSecret: '<placeholder>',
	http: undefined,
	https: undefined
};

// export config
module.exports = config;

function loadFromDir(confDir) {
	if (!confDir || !fs.existsSync(confDir)) {
		return;
	}
	// load default configuration
	var defaultConfFilePath = path.join(confDir, 'default.js');
	debug('defaultConfFilePath: %s', defaultConfFilePath);
	if (fs.existsSync(defaultConfFilePath)) {
		_.merge(config, require(defaultConfFilePath));
	}
	// load enviromental specific configuration
	var globPattern = confDir + '/**/*.' + config.env + '.js*';
	utils.getGlobbedFiles(globPattern).forEach(function (filePath) {
		debug('loadConfigFrom: %s', filePath);
		_.merge(config, require(filePath));
	});
}

(function initialize() {
	// load module configurations
	if (clout.modulesDir) {
		loadFromDir(path.join(clout.modulesDir, '/*/conf'));
	}
	// load application configuration last
	clout.appDir && loadFromDir(path.join(clout.appDir, 'conf'));
})();