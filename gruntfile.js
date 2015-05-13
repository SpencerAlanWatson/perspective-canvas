module.exports = function (grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			dist: {
				src: ['client/lib/jquery.min.js',
					  'client/lib/bootstrap.min.js',
					  'client/lib/lodash.min.js',
					  'client/lib/stats.js',
					  'client/js/perspective.js',
					  'client/js/main.js'],
				dest: 'client/build/<%= pkg.name %>.js',
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				screwIE8: true,
			},
			build: {
				src: 'client/build/<%= pkg.name %>.js',
				dest: 'client/build/<%= pkg.name %>.min.js'
			}
		}
	});

	// Load the plugin that provides the "concat" task.
	grunt.loadNpmTasks('grunt-contrib-concat');

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('default', ['concat', 'uglify']);

};