/*global module */

module.exports = function( grunt ) {
	"use strict";

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);



	grunt.initConfig({

		uglify: {
			options: {
				mangle: {
					except: ['mSwipeSlider']
				}
			},
			dist: {
				files: {
					'build/jquery.m-swipe-slider.min.js': 'jquery.m-swipe-slider.js'
				}
			}
		},

		watch: {
			loadFiles: {
					files: ['index.html', '*.js', '*.css', '.jshintrc']
			},
			options: {
				// default port is 35729
				livereload: 1337,
			},
			scripts: {
				files: ['**/*.js'],
				tasks: ['jshint'],
				options: {
					spawn: false,
				},
			},
		},

		jshint: {
			all: ['jquery.m-swipe-slider.js', 'Gruntfile.js'],
			options: {
				jshintrc: true,
			},
		},

		// grunt-contrib-connect will serve the files of the project
		// on specified port and hostname and injects the live reload script
		connect: {
			all: {
				options:{
					port: 9000,
					hostname: "0.0.0.0",
					middleware: function(connect, options) {
						return [
							require('connect-livereload')({
								port: grunt.config.get("watch.options.livereload")
								// ignore: ['Gruntfile.js']
							}),
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
		}
	});

	// build
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-jshint');


	grunt.registerTask('build', 'jshint', 'uglify');

	// dev server / auto reload
	grunt.registerTask('dev', ['connect', 'jshint', 'open', 'watch']);
	grunt.registerTask('default', 'dev');
};