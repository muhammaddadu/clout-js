/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/apis'),
	utils = require('../lib/utils');

module.exports = {
	initialize: {
		event: 'start',
		priority: 'API',
		fn: function (next) {
			next();
		}
	}
};
