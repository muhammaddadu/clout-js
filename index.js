/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const path = require('path');

var Clout = require('./lib/Clout');

/**
 * Root application directory
 * @type {path}
 */
var applicationDirectory = module.parent && path.dirname(module.parent.filename);

if (!applicationDirectory) {
	throw new Error('application not found');
}

module.exports = new Clout(applicationDirectory);
module.exports.utils = require('./lib/utils');
