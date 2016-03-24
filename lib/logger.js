/**
 * Clout Javascript Framework
 */
var debug = require('debug')('clout:logger'),
	fs = require('fs-extra'),
	path = require('path'),
	winston = require('winston'),
	DailyRotateFile = require('winston-daily-rotate-file');

var LOG_DIR = undefined;

module.exports = function models(clout) {
	debug('initialize');
	clout.logger = new winston.Logger();

	clout.app.use(function (req, resp, next) {
		req.logger = clout.logger;
		next();
	});

	if (!clout.appDir) {
		return;
	}

	!LOG_DIR && (LOG_DIR = path.join(clout.appDir, 'logs'));
	debug('LOG_DIR', LOG_DIR);
	!fs.existsSync(LOG_DIR) && fs.mkdirSync(LOG_DIR);

	debug('add transport', 'DailyRotateFile');
	clout.logger.configure({
	    level: 'verbose',
	    transports: [
			new (winston.transports.Console)(),
			new DailyRotateFile({
				filename: path.join(LOG_DIR, 'clout_'),
			    datePattern: 'yyyy-MM-dd.log'
			})
		]
	});
};
