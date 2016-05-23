/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */

module.exports = function(grunt) {
    grunt.initConfig({
        mochaTest: {
            test: {
                src: ['test/**/*_test.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
	grunt.registerTask('test', 'mochaTest');
};
