/*!
 * clout-js-test-app
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const request = require('request');

module.exports = {
	list: {
		path: '/jokes',
		description: 'get jokes',
		method: 'get',
		fn: function list(req, res) {
			request({
				uri: 'http://api.icndb.com/jokes/random/10',
				json: true
			}, function (err, request, data) {
				if (err) { return res.error(err); }
				res.ok(data);
			});
		}
	}
};
