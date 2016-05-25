Changelog
==============
## 1.0.5
##### Features:
- Ability to add extensions to APIs to change the content-type returned.
- Improved JSON visualizer
- Modules can now load Modules
- Various bug fixes

## 1.0.0
##### Features:
- Ability to inject code into the runtime (Easily extend the framework using hooks)
- Modules have full access to the runtime
- Modules can be installed via npm
- JSON visualizer when browsing APIs via browser
- Support for multiple layout engines when rendering pages

##### Changes
- Complete re-architecture of the framework internals
- Updated GLOB patterns for configuration (e.g now supports naming conventions like `development.js`, `something.default.js`.)
- Sequelize models, redis session & flash cookies have been moved to seperate modules

## 0.2.0
##### Features:
- Added Changelog
- Deeper integration for modules

##### Changes
- cloutConf.json is now clout.json

## 0.1.1
- Initial public release