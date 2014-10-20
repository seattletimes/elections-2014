/*

Parent module for scraping election results and loading into the local JSON store.
Relies on adapters in tasks/lib for specific sites.

*/

var async = require("async");

module.exports = function(grunt) {

  //call various adapters to get resources
  var secState = require("./lib/secState");

  grunt.registerTask("scrape", "Pull data from election result endpoints", function() {
    console.log(arguments);

    grunt.task.requires("state");
    grunt.task.requires("json");

    var c = this.async();

    async.parallel([secState.statewide, secState.counties], function(err, results) {
      var statewide = results[0];
      console.log(statewide);
      grunt.file.write("temp/statewide.json", JSON.stringify(statewide, null, 2));
      c();
    });

  });


};