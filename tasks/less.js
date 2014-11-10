/*

Run the LESS compiler against seed.less and output to style.css.

*/

module.exports = function(grunt) {

  var async = require("async");
  var less = require("less");
  var path = require("path");
  
  var options = {
    paths: ["src/css"]
  };

  var files = ["style.less", "widget.less"];
  
  grunt.registerTask("less", function() {
    
    var done = this.async();

    var seeds = grunt.file.expandMapping(files, "./build", {
      ext: ".css",
      cwd: "src/css"
    });
    seeds.forEach(function(s) { s.cwd = "src/css"});
    
    var components = grunt.file.expandMapping("js/components/**/*.less", "temp", {
      ext: ".less",
      cwd: "src"
    });
    components.forEach(function(c) {
      c.cwd = path.dirname(c.src[0]);
    });
    
    var mappings = seeds.concat(components);

    async.each(mappings, function(mapping, c) {

      var filename = mapping.src.pop();

      var seed = grunt.file.read(filename);
      
      less.render(seed, { paths: [mapping.cwd] }).then(function(result) {
        grunt.file.write(mapping.dest, result.css);
        c();
      }, function(err) {
        console.error(mapping.dest, err.message);
        c(err);
      });
    }, done);
    
    
  });

};