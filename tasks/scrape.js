/*

Parent module for scraping election results and loading into the local JSON store.
Relies on adapters in tasks/lib for specific sites.

*/

var async = require("async");

var debug = true;

module.exports = function(grunt) {

  //call various adapters to get resources
  var secState = require("./lib/secState");
  var kingCounty = require("./lib/king");

  grunt.registerTask("scrape", "Pull data from election result endpoints", function() {

    grunt.task.requires("state");
    grunt.task.requires("json");

    var c = this.async();

    async.parallel([secState.statewide, secState.counties, kingCounty], function(err, results) {
      var statewide = results[0];
      var counties = results[1];
      var king = results[2];
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

      statewide.forEach(function(result) {
        var race = races[result.race];
        race.results[result.candidate] = result;
      });

      //add county data to mappable races
      var mapped = {};
      Object.keys(races).forEach(function(id) {
        var race = races[id];
        if (race.map) {
          var countyMap = {};
          counties.forEach(function(result) {
            if (result.race == id) {
              //testing data
              if (debug) {
                result.votes = Math.round(Math.random() * 1000);
              }
              if (!countyMap[result.location]) {
                countyMap[result.location] = {
                  winner: result,
                  results: []
                };
              }
              var county = countyMap[result.location];
              county.results.push(result);
              if (county.winner.votes < result.votes) {
                county.winner = result;
              }
            }
          });
          race.map = mapped[id] = countyMap;
        }
      });

      //add fake data
      if (debug) {
        for (var id in races) {
          var race = races[id];
          var total = 0;
          var candidates = Object.keys(race.results);
          candidates.forEach(function(name) {
            var result = race.results[name];
            var votes = Math.round(Math.random() * 1000);
            result.votes = votes;
            total += votes;
          });
          //now find percentages
          candidates.forEach(function(name) {
            var result = race.results[name];
            result.percent = (result.votes / total * 100).toFixed(1);
          });
        }
      }

      var categories = ["Featured"].concat(Object.keys(categorized).sort());
      categorized.Featured = featured;
      races.categorized = categorized;
      races.categories = categories;
      races.mapped = mapped;

      grunt.data.election = races;
      c();
    });

  });


};