/**
 * Homepage
 */
var path = require('path');

const tpl = {
	layout: path.join(__dirname, '../views/layout.ejs'),
	title: 'Full-stack NodeJS framework',
	meta: [
		{
			name: 'keywords',
			content: 'nodejs, node, nodejs framework, full-stack framework'
		},
		{
			name: 'description',
			content: 'Clean, simplistic, enterprise grade full-stack NodeJS framework'
		}
	],
	css: ['/css/home.css'],
	javascript: ['/js/home.js']
};

module.exports = {
	path: '/',
	method: 'all',
	description: 'Homepage',
	fn: function (req, res, next) {
		res.render('home.ejs', tpl);
	}
};
