/*global module */


module.exports = function( grunt ) {
	"use strict";

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);



	grunt.initConfig({

		uglify: {
			options: {
				mangle: {
					except: ['mSwipe']
				}
			},
			dist: {
				files: {
					'build/jquery.m-swipe.min.js': 'jquery.m-swipe.js'
				}
			}
		},

		// grunt-contrib-connect will serve the files of the project
		// on specified port and hostname
		connect: {
			all: {
				options:{
					port: 9000,
					hostname: "0.0.0.0",
					middleware: function(connect, options) {
						return [
							require('grunt-contrib-livereload/lib/utils').livereloadSnippet,
							// Serve the project folder
							connect.static(options.base)
						];
					}
				}			
			}
		},

		open: {
			all: {
				path: 'http://localhost:<%= connect.all.options.port%>'
			}
		},

		// grunt-regarde monitors the files and triggers livereload
		// Surprisingly, livereload complains when you try to use grunt-contrib-watch instead of grunt-regarde 
		regarde: {
			all: {
				// This'll just watch the index.html file, you could add **/*.js or **/*.css
				// to watch Javascript and CSS files too.
				files:['index.html','*.js','*.css'],
				// This configures the task that will run when the file change
				tasks: ['livereload']
			}
		}

	});

	// build
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('build', 'uglify');

	// dev server / auto reload
	grunt.registerTask('server', ['livereload-start', 'connect', 'open', 'regarde']);
	
	grunt.registerTask('default', 'server');
};