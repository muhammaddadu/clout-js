/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	debug = require('debug')('clout:hook/server'),
	https = require('https');

module.exports = {
	http: {
		event: 'start',
		priority: 25,
		fn: function (next) {
			var self = this,
				port = process.env.PORT || this.config.http && this.config.http.port || 8080;
				this.server.http = this.app.listen(port, function () {
					debug('http server started on port %s', self.server.http.address().port);
					next();
				});
		}
	},
	https: {
		event: 'start',
		priority: 25,
		fn: function (next) {
			if (!this.config.https) { return next(); }
			debug('Securely using https protocol');
			var port = process.env.SSLPORT || this.config.https.port || 8443,
				conf = this.config.https;
			delete conf.port;
			this.server.https = https.createServer(conf, this.app).listen();
			debug('https server started on port %s', this.server.https.address().port);
			next();
		}
	}
};
