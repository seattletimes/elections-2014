/*

Run the LESS compiler against seed.less and output to style.css.

*/

module.exports = function(grunt) {

  var async = require("async");
  var less = require("less");
  
  var options = {
    paths: ["src/css"]
  };

  var files = ["style.less", "widget.less"];
  
  grunt.registerTask("less", function() {
    
    var c = this.async();

    var paths = grunt.file.expandMapping(files, "./build", {
      ext: ".css",
      cwd: "src/css"
    });

    async.each(paths, function(path, done) {

      var filename = path.src.pop();

      var seed = grunt.file.read(filename);
      
      var parser = new less.Parser(options);
      parser.parse(seed, function(err, tree) {
        var css = tree.toCSS();
        grunt.file.write(path.dest, css);
        done();
      });
    }, c);
    
    
  });

};