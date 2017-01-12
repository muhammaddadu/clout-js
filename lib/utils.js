/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	_ = require('lodash'),
	glob = require('glob');

var utils = module.exports = {};

/**
 * get globbed files
 * @param  {string|array} globPatterns glob pattern
 * @return {array}  files 	array of files matching glob
 */
utils.getGlobbedFiles = function getGlobbedFiles(globPatterns) {
	var self = this,
		output = [];
	if (_.isArray(globPatterns)) {
		globPatterns.forEach(function (globPattern) {
			output = _.union(output, self.getGlobbedFiles(globPattern, toRemove));
		});
	} else if (_.isString(globPatterns)) {
		var files = glob(globPatterns, {
			sync: true
		});
		output = _.union(output, files);
	}
	return output;
};

/**
 * Get value from object using string
 * @param  {String} key string representing path
 * @param  {Object} obj Object to travel
 * @return {Object}     value
 */
utils.getValue = function getValue(keyString, obj) {
	let nodes = keyString.split('.');
	let key = obj;

	do {
		let node = nodes.shift();

		if (key && key.hasOwnProperty(node)) {
			key = key[node];
			continue;
		}

		nodes = [];
		key = undefined;
	} while (nodes && nodes.length > 0);

	return key;
};
