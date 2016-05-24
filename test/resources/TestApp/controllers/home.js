/**
 * Homepage
 */
var path = require('path');

module.exports = {
	path: '/',
	method: 'all',
	description: 'Homepage',
	group: 'Marketing',
	fn: function (req, res, next) {
		res.render('home', {
			title: 'Home',
			message: 'Welcome to TestApp'
		});
	}
};
