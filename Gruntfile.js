module.exports = function(grunt) {

    // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat:{
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'build/<%= pkg.name %>.js'
      }
    }, 


    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: ['build/<%= pkg.name %>.js'],
        dest: 'build/<%= pkg.name %>.ugly.js'
      }
    },
    gcc:{
      dist:{
        dest:'build/<%= pkg.name %>.min.js',
        src:'build/<%= pkg.name %>.js'
      }
    },
    
    watch: {
      assets : {
        files : ['src/**/*.*'],
        tasks : ['default']
      },
      html : {
        files   : ['index.min.html', 'src/js/audio.js'],
        options : {
          livereload : true
        }
      }
    },
    assemble: {
      options: {
        partials : ['src/**/*.*', 'build/*.js'],
        dev: true,
        prod: false
      },
      files: {
        src   : ['src/templates/index.hbs'],
        dest  : 'index.html'
      }
    },
    htmlmin: {                                     // Task
      dist: {                                      // Target
        options: {                                 // Target options
          removeComments: true,
          collapseWhitespace: true, 
          removeOptionalTags : true
        },
        files: {                                   // Dictionary of files
          'index.min.html': 'index.html',     // 'destination': 'source'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('assemble');
  grunt.loadNpmTasks('grunt-gcc');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify','gcc', 'assemble', 'htmlmin']);
  grunt.registerTask('auto', ['default', 'watch']);
};
