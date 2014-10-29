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
      var raceConfig = grunt.file.readJSON("json/Election2014_Races.json").filter(function(d) { return !d.uncontested });
      var races = {};
      var categorized = {};
      var featured = [];
      raceConfig.forEach(function(row) {
        races[row.code || row.sosraceid] = row;
        row.results = [];
        var cat = row.category || "none";
        if (!categorized[cat]) {
          categorized[cat] = {
            races: [],
            grouped: {}
          };
        }
        var subcat = row.subcategory;
        if (row.subcategory) {
          if (!categorized[cat].grouped[subcat]) {
            categorized[cat].grouped[subcat] = [];
          }
          categorized[cat].grouped[subcat].push(row);
        } else {
          categorized[cat].races.push(row);
        }
        if (row.featured) {
          featured.push(row);
        }
      });

      statewide.forEach(function(result) {
        var race = races[result.race];
        race.results.push(result);
      });

      //add King county results
      king.forEach(function(entry) {
        var exists = races[entry.race];
        if (!exists) return console.log("Not including King race:", entry.race);
        races[entry.race].results = entry.results;
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
      raceConfig.forEach(function(config) {
        if (config.map) {
          var countyMap = {};
          counties.forEach(function(result) {
            if (result.race == config.code) {
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
          races[config.code].map = mapped[config.code] = countyMap;
        }
      });

      var categories = ["Key Races"].concat(Object.keys(categorized).sort());
      categorized["Key Races"] = { races: featured, grouped: {} };

      grunt.data.election = {
        all: races,
        categorized: categorized,
        categories: categories,
        mapped: mapped
      };

      c();
    });

  });


};