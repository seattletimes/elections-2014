/*

Parent module for scraping election results and loading into the local JSON store.
Relies on adapters in tasks/lib for specific sites.

*/

var async = require("async");

module.exports = function(grunt) {

  //call various adapters to get resources
  var secState = require("./lib/secState");

  grunt.registerTask("scrape", "Pull data from election result endpoints", function() {

    grunt.task.requires("state");
    grunt.task.requires("json");

    var c = this.async();

    async.parallel([secState.statewide, secState.counties], function(err, results) {
      var statewide = results[0];
      //attach results to races
      var raceConfig = grunt.file.readJSON("json/Election2014_Races.json");
      var races = {};
      var categorized = {};
      var featured = [];
      raceConfig.forEach(function(row) {
        races[row.code] = row;
        row.results = {};
        var cat = row.category || "none";
        if (!categorized[cat]) {
          categorized[cat] = [];
        }
        categorized[cat].push(row);
        if (row.featured) {
          featured.push(row);
        }
      });
      var categories = ["Featured"].concat(Object.keys(categorized).sort());
      categorized.Featured = featured;
      races.categorized = categorized;
      races.categories = categories;

      statewide.forEach(function(result) {
        var race = races[result.race];
        race.results[result.candidate] = result;
      });
      grunt.data.election = races;
      c();
    });

  });


};