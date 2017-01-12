Clout Javascript Framework
===========

## Install
```
$ npm install clout-js
```

## Project Structure
```
/conf 			- contains configuration w/ support for NODE_ENV
/apis 			- contains apis for the application
/hooks			- hooks which can be invoked before an api
/models 		- contains models (native support for sequalize)
/public 		- public folder
/controllers 	- contains controllers for application
```

## Usage
### app.js example
```
var clout = require('clout-js');

clout.on('started', function () {
	if (clout.server.https) {
		console.info('http server started on port %s', clout.server.https.address().port);
	}
	if (clout.server.http) {
		console.info('http server started on port %s', clout.server.http.address().port);
	}
});

clout.app.use(function (req, res, next) {
	next();
});

clout.start();
```
### /api/ping.js example
```
var clout = require('clout-js');

module.exports = {
	list: {
		path: '/ping',
		description: 'ping service',
		method: 'get',
		fn: function get(req, res) {
			res.ok('GET REQUEST');
		}
	},
	publish: {
		path: '/ping',
		description: 'ping service',
		method: 'post',
		// hooks: [ auth.isLoggedIn() ],
		fn: function post(req, res) {
			res.ok('POST REQUEST');
		}
	}
}
```

### Enviromental Config
- development (DEFAULT)
- <enviroment>

These enviromental variable can be set using NODE_ENV=<enviroment>.

These configuration files can be stored in ```/conf``` with <name>.<env>.js with default.<env>.js always 

