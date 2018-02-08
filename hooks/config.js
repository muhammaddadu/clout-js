/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Config hooks
 * @module clout-js/hooks/config
 */
const debug = require('debug')('clout:hook/config');

module.exports = {
	/**
	 * add config to application locals
	 * @property {event} event start
	 * @property {priority} priority 25
	 */
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
