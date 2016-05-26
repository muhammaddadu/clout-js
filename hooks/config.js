/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/config');

module.exports = {
	middleware: {
		event: 'start',
		priority: 25,
		fn: function (next) {
			!this.app.locals && (this.app.locals = {});
			this.app.locals.config = this.config;
			this.app.request.clout = this;
			next();
		}
	}
};
