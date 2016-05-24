/*!
 * clout-js-test-app
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
var path = require('path');

module.exports = {
	path: '/:ext?',
	method: 'all',
	description: 'Homepage',
	group: 'Marketing',
	fn: function (req, res, next) {
		res.render('home' + (req.params.ext || ''), {
			title: 'Jokes Application'
		});
	}
};
