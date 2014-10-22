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

//pull the race config so as to filter out county data we don't care about.
var races = require("../../json/Election2014_Races.json");
var raceList = races.map(function(d) { return d.code });

/*
* Very particular race assignment rules - only good for the 2014 midterm!
*/
var getRaceID = function(row) {
  var race = row.Race;
  var jurisdiction = row.JurisdictionName;

  if (jurisdiction.match(/state (measures|executive)/i)) {
    //ballot measures
    var prefix = "ballot-";
    if (race.match(/Advisory/)) {
      prefix = "advisory-";
    }
    return prefix + race.match(/No\. (\d+)/)[1];

  } else if (jurisdiction.match(/congressional/i)) {
    //US Congress races
    return "us-rep-" + race.match(/District (\d+)/)[1];

  } else if (jurisdiction.match(/legislative/i)) {
    //state legislature
    var district = race.match(/District (\d+)/)[1];
    if (race.match(/Representative/)) {
      //get the district and position
      var position = race.match(/Pos. (\d+)/)[1];
      return ["state-rep", district, position].join("-");
    }
    return ["state-sen", district].join("-");

  } else if (jurisdiction.match(/judicial|(supreme|superior|appeals) court/i)) {
    //state judiciary
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

  } else {
    //fallback
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
    var raceID = getRaceID(row);
    if (raceList.indexOf(raceID) < 0) return;
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
    if (!fs.existsSync("./temp")) {
      fs.mkdirSync("./temp");
    }
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