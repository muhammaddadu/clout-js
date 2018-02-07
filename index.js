/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const path = require('path');
const Clout = require('./lib/Clout');
const {merge} = require('lodash');

const CONF = merge({
	APPLICATION_DIR: module.parent && path.dirname(module.parent.filename)
}, {
	APPLICATION_DIR: process.env.APPLICATION_DIR
});

/**
 * Root application directory
 * @type {path}
 * @return directory that called module first
 */
if (!CONF.APPLICATION_DIR) {
	throw new Error('application not found');
}

module.exports = new Clout(CONF.APPLICATION_DIR);
module.exports.utils = require('./lib/utils');
