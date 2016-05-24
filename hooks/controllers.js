/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/controllers'),
	utils = require('../lib/utils');

module.exports = {
	initialize: {
		event: 'start',
		priority: 'CONTROLLER',
		fn: function (next) {
			next();
		}
	}
};
