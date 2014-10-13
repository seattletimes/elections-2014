/*

Parent module for scraping election results and loading into the local JSON store.
Relies on adapters in tasks/lib for specific sites.

*/

var async = require("async");

module.exports = function(grunt) {

  //call various adapters to get resources
  var secState = require("./lib/secState");

  grunt.registerTask("scrape", "Pull data from election result endpoints", function() {

    var c = this.async();

    async.parallel([secState.statewide, secState.counties], function(err, results) {
      console.log(err, results);
      c();
    });

  });


};