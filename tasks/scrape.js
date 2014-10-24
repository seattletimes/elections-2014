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
        row.results = [];
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
        race.results.push(result);
      });

      //aggregate county results
      var aggregated = {};
      counties.forEach(function(county) {
        var race = races[county.race];
        //do we have statewide results for this?
        if (race.results.length) return;
        //if not, create temporary aggregation info
        if (!aggregated[county.race]) aggregated[county.race] = race;
        if (!race.aggregate) race.aggregate = {};
        if (!race.aggregate[county.candidate]) race.aggregate[county.candidate] = [];
        //add the race to the aggregation
        race.aggregate[county.candidate].push(county);
      });
      Object.keys(aggregated).forEach(function(county) {
        var total = 0;
        county = aggregated[county];
        for (var candidate in county.aggregate) {
          var list = county.aggregate[candidate];
          var result = {};
          //object.create doesn't work for JSON, so manually copy
          for (var key in list[0]) result[key] = list[0][key];
          result.location = "Aggregated";
          result.votes = list.reduce(function(prev, now) { return prev + now.votes }, 0);
          county.results.push(result);
          total += result.votes;
        }
        //figure percentages
        county.results.forEach(function(result) {
          result.percent = Math.round(result.votes / total * 1000) / 10;
        });
        delete county.aggregate;
      });

      //add county data to mappable races
      var mapped = {};
      Object.keys(races).forEach(function(id) {
        var race = races[id];
        if (race.map) {
          var countyMap = {};
          counties.forEach(function(result) {
            if (result.race == id) {
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