

module.exports = function(grunt) {

  //load tasks
  grunt.loadTasks("./tasks");

  grunt.registerTask("template", "Perform a complete build of data and templates", ["state", "json", "csv", "scrape", "build"]);
  grunt.registerTask("static", ["copy", "less", "amd", "template"]);
  grunt.registerTask("default", ["static", "connect:dev", "watch"]);
  grunt.registerTask("update", ["sheets", "static", "publish:live"]);
};
