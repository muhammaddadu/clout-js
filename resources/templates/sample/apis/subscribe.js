/**
 * Subscribe APIs
 */
module.exports = {
	subscribe: {
		method: 'POST',
		path: '/subscribe',
		description: 'user subscription',
		fn: function (req, res) {
			res.ok('subscribed');
		}
	},
	unsubscribe: {
		method: 'DELETE',
		path: '/subscribe',
		description: 'user subscription',
		fn: function (req, res) {
			res.ok('unsubscribed');
		}
	}
};