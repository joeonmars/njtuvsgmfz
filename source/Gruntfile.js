'use strict';

module.exports = function( grunt ) {

	// Project configuration.
	grunt.initConfig( {

		watch: {
			html: {
				files: [ '*.{html,php}' ],
				options: {
					livereload: true,
					interrupt: true,
					spawn: true,
				},
			},
			soy: {
				files: [ 'soy/**/*.soy' ],
				tasks: [ 'closureSoys' ]
			},
			js: {
				files: [ 'js/**/*.js' ],
				tasks: [ 'browserify', 'exorcise:bundle' ],
				options: {
					livereload: true,
					interrupt: true,
					spawn: true,
				},
			},
			scss: {
				files: [ 'scss/**/*.scss' ],
				tasks: [ 'compass' ],
				options: {
					livereload: true,
					interrupt: true,
					spawn: true,
				},
			},
			css: {
				files: [ 'css/*.css' ],
				options: {
					livereload: true,
					interrupt: true,
					spawn: true,
				},
			},
			svg: {
				files: [ 'fonts/fontcustom/icons/*.svg' ],
				tasks: [ 'webfont' ]
			}
		},

		exorcise: {
			bundle: {
				options: {},
				files: {
					'output/bundle.map': [ 'output/bundle.js' ],
				}
			}
		},

		browserify: {
			options: {
				browserifyOptions: {
					debug: true
				},
				plugin: [
					[
						'remapify', [ {
							src: '**/*.js',
							expose: 'app',
							cwd: './js'
						}, {
							src: '**/*.js',
							expose: 'views',
							cwd: './js/views'
						}, {
							src: '**/*.js',
							expose: 'controllers',
							cwd: './js/controllers'
						}, {
							src: '**/*.js',
							expose: 'common',
							cwd: './js/common'
						}, {
							src: '**/*.js',
							expose: 'states',
							cwd: './js/states'
						}, {
							src: '**/*.js',
							expose: 'models',
							cwd: './js/models'
						}, {
							src: '**/*.js',
							expose: 'entities',
							cwd: './js/entities'
						}, {
							src: '**/*.js',
							expose: 'libs',
							cwd: './js/libs'
						} ]
					]
				]
			},
			dist: {
				files: {
					'output/bundle.js': [ 'js/main.js' ]
				}
			}
		},

		closureSoys: {
			all: {
				src: 'soy/**/*.soy',
				soyToJsJarPath: 'tools/SoyToJsSrcCompiler.jar',
				outputPathFormat: 'js/views/{INPUT_FILE_NAME}.js',
				options: {
					shouldGenerateJsdoc: true,
					shouldProvideRequireSoyNamespaces: false
				}
			}
		},

		compass: {
			options: {
				sassDir: 'scss',
				cssDir: 'css',
				fontsDir: 'fonts',
				imagesDir: 'images',
				generatedImagesDir: 'images/generated',
				relativeAssets: true,
				noLineComments: true,
				assetCacheBuster: true,
				watch: false,
				require: [ 'breakpoint' ]
			},
			development: {
				options: {
					outputStyle: 'nested', //nested, expanded, compact, compressed
					environment: 'development',
				}
			},
			production: {
				options: {
					outputStyle: 'compressed', //nested, expanded, compact, compressed
					environment: 'production',
				}
			},
		},

		webfont: {
			icons: {
				src: 'fonts/fontcustom/icons/*.svg',
				dest: 'fonts/fontcustom',
				destCss: 'scss',
				options: {
					stylesheet: 'scss',
					htmlDemo: true,
					hashes: true,
					engine: 'node',
					templateOptions: {
						baseClass: 'icon',
						classPrefix: 'icon-',
						mixinPrefix: 'icon-'
					}
				}
			}
		},

		copy: {
			release: {
				files: [ {
					expand: true,
					cwd: './',
					src: [
						'**',
						'!js/**',
						'!node_modules/**',
						'!scss/**',
						'!output/bundle.map',
						'!soy/**',
						'!tools/**',
						'!Gemfile.lock',
						'!Gemfile',
						'!Gruntfile.js',
						'!package.json',
						'!images/icons/**',
						'!images/icons-2x/**',
						'!images/ui/**',
						'!images/ui-2x/**',
						'!fonts/font-custom/icons/**',
					],
					dest: '../release',
					filter: 'isFile'
				}, ]
			}
		},

		uglify: {
			release: {
				files: {
					'../release/output/bundle.js': [ '../release/output/bundle.js' ]
				}
			}
		},
	} );

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks( 'grunt-browserify' );
	grunt.loadNpmTasks( 'grunt-exorcise' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-compass' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-closure-soy' );
	grunt.loadNpmTasks( 'grunt-webfont' );

	// Tasks.
	grunt.registerTask( 'development', [
		'compass:development',
		'webfont',
		'closureSoys',
		'browserify',
		'exorcise:bundle',
		'watch',
	] );

	grunt.registerTask( 'release', [
		'compass:production',
		'webfont',
		'closureSoys',
		'browserify',
		'exorcise:bundle',
		'copy',
		'uglify:release',
	] );
};