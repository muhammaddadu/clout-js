/**
 * Clout Javascript Framework
 */
var debug = require('debug')('clout:models'),
	async = require('async'),
	_ = require('lodash'),
	Sequelize = require('sequelize'),
	utils = require('./utils');

var path = require('path'),
	FILENAME_REGEX = /\/([\d\w]*).js/;

module.exports = function models(clout) {
	if (!clout.appDir) { return; }
	clout.models = {};
	var MODELS_DIR = path.join(clout.appDir, 'models'),
		sequelize = undefined;

	// load connection
	if (clout.config.sequelize) {
		var sconf = clout.config.sequelize;
		clout.Sequelize = Sequelize;
		clout.sequelize = sequelize = new Sequelize(sconf.database, sconf.username, sconf.password, sconf.connection);
	}

	function load(filePath) {
		var fileName = FILENAME_REGEX.exec(filePath)[1];
		debug('loading model %s', fileName);
		if (clout.models.hasOwnProperty(fileName)) {
			throw new Error('Cannot load model `' + fileName + '` as it already exists');
			return;
		}
		clout.models[fileName] = require(filePath);
	}

	// load models
	debug('loading models');
	// check modules
	if (clout.modulesDir) {
		debug('loading models from modules');
		utils.getGlobbedFiles(path.join(clout.modulesDir, '/*/models/**/*.js')).forEach(load);
	}
	debug('MODELS_DIR: %s', MODELS_DIR);
	utils.getGlobbedFiles(MODELS_DIR + '/**/*.js').forEach(load);
};
