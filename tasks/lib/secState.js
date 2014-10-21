var csv = require("csv");
var fs = require("fs");
var request = require("request");
var configs = {
  statewide: {
    cache: "statewide.json",
    url: "http://results.vote.wa.gov/results/current/export/20141104_AllState.csv",
    location: "state"
  },
  counties: {
    cache: "counties.json",
    url: "http://results.vote.wa.gov/results/current/export/20141104_AllCounties.csv",
    location: function(d) { return d.County }
  },
  precincts: {
    cache: "precincts.json",
    url: "http://results.vote.wa.gov/results/current/export/20141104_AllStatePrecincts.csv",
    location: function(d) { return d.PrecinctCode },
    filter: function(d) { return d.PrecinctCode != -1 }
  }
};

/*
* Very particular race assignment rules - only good for the 2014 midterm!
*/
var getRaceID = function(row) {
  var race = row.Race;
  switch (row.JurisdictionName) {

  case "State Executive":
    var prefix = "ballot-";
    if (race.match(/Advisory/)) {
      prefix = "advisory-";
    }
    return prefix + race.match(/No\. (\d+)/)[1];

  case "Congressional":
    return "us-rep-" + race.match(/District (\d+)/)[1];

  case "Legislative":
    var district = race.match(/District (\d+)/)[1];
    if (race.match(/Representative/)) {
      //get the district and position
      var position = race.match(/Pos. (\d+)/)[1];
      return ["state-rep", district, position].join("-");
    }
    return ["state-sen", district].join("-");

  case "Judicial":
    var position = race.match(/Position (\d+)/)[1];
    if (race.match(/Appeals/)) {
      var division = race.match(/Division (\d+)/)[1];
      var district = race.match(/District (\d+)/)[1];
      return ["appeals", division, district, position].join("-");
    } else if (race.match(/Supreme/)) {
      return "supreme-" + position;
    }
    //superior court
    return race.match(/^\w+/)[0].toLowerCase() + "-court-" + position;

  default:
    return row.Race;
  }
};

var getResults = function(config, c) {
  var cachePath = "./temp/" + config.cache;
  if (fs.existsSync(cachePath)) {
    if (fs.statSync(cachePath).mtime > (new Date(Date.now() - 5 * 60 * 1000))) {
      return c(null, JSON.parse(fs.readFileSync(cachePath)));
    }
  }
  var parser = csv.parse({
    columns: true,
    auto_parse: true
  });
  var rows = [];
  parser.on("data", function(row) {
    //cull garbage rows
    if (config.filter && !config.filter(row)) return;
    //transform the data to match our schema
    rows.push({
      race: getRaceID(row),
      candidate: row.Candidate, //implement candidate aliasing
      votes: row.Votes,
      percent: row.PercentageOfTotalVotes,
      source: "Secretary of State",
      location: typeof config.location == "function" ? config.location(row) : config.location
    });
  });
  parser.on("finish", function() {
    fs.writeFileSync(cachePath, JSON.stringify(rows, null, 2));
    c(null, rows);
  });
  request(config.url).pipe(parser);
};

module.exports = {
  statewide: getResults.bind(null, configs.statewide),
  counties: getResults.bind(null, configs.counties),
  precincts: getResults.bind(null, configs.precincts)
};