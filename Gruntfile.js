

module.exports = function(grunt) {

  //load tasks
  grunt.loadTasks("./tasks");

  grunt.registerTask("template", "Perform a complete build of data and templates", ["state", "json", "csv", "scrape", "build"]);
  grunt.registerTask("static", ["copy", "amd", "less", "template"]);
  grunt.registerTask("default", ["static", "connect:dev", "watch"]);
  grunt.registerTask("poll", ["state", "json", "scrape"]);
  grunt.registerTask("update", ["sheets", "poll", "static", "publish:live"]);
};
