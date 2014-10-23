var csv = require("csv");
var fs = require("fs");
var request = require("request");
var aliases = require("./aliases");
var project = require("../../project.json");
var configs = {
  statewide: {
    cache: "statewide.json",
    url: "http://results.vote.wa.gov/results/current/export/MediaResults.txt",
    location: "state"
  },
  counties: {
    cache: "counties.json",
    url: "http://results.vote.wa.gov/results/current/export/MediaResultsByCounty.txt",
    location: function(d) { return d.CountyName }
  }
};

//pull the race config so as to filter out county data we don't care about.
var races = require("../../json/Election2014_Races.json");
var raceList = races.map(function(d) { return d.code });

var getRaceID = function(row) {
  var race = row.RaceName;
  var id = row.RaceID;

  //look up from spreadsheet - easiest way
  for (var i = 0; i < races.length; i++) {
    if (id == races[i].sosraceid) {
      return races[i].code;
    }
  }

  return race;
};

var getResults = function(config, c) {
  var cachePath = "./temp/" + config.cache;
  if (project.caching && fs.existsSync(cachePath)) {
    if (fs.statSync(cachePath).mtime > (new Date(Date.now() - 5 * 60 * 1000))) {
      return c(null, JSON.parse(fs.readFileSync(cachePath)));
    }
  }
  var parser = csv.parse({
    columns: true,
    auto_parse: true,
    delimiter: "\t"
  });
  var rows = [];
  parser.on("data", function(row) {
    //transform the data to match our schema
    var raceID = getRaceID(row);
    var name = aliases.antialias(row.BallotName);
    var candidate = aliases.getCandidateInfo(name);
    if (raceList.indexOf(raceID) < 0) return;
    rows.push({
      race: getRaceID(row),
      candidate: name,
      party: candidate.party,
      incumbent: candidate.incumbent,
      description: candidate.description,
      votes: row.Votes,
      percent: Math.round(row.Votes / row.TotalBallotsCastByRace * 1000) / 10,
      source: "Secretary of State",
      location: typeof config.location == "function" ? config.location(row) : config.location
    });
  });
  parser.on("finish", function() {
    if (project.caching) {
      if (!fs.existsSync("./temp")) {
        fs.mkdirSync("./temp");
      }
      fs.writeFileSync(cachePath, JSON.stringify(rows, null, 2));
    }
    c(null, rows);
  });
  request(config.url).pipe(parser);
};

module.exports = {
  statewide: getResults.bind(null, configs.statewide),
  counties: getResults.bind(null, configs.counties),
  precincts: getResults.bind(null, configs.precincts)
};