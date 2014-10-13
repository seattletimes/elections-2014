var csv = require("csv");
var request = require("request");
var configs = {
  statewide: {
    url: "http://results.vote.wa.gov/results/current/export/20141104_AllState.csv",
    location: "state"
  },
  counties: {
    url: "http://results.vote.wa.gov/results/current/export/20141104_AllCounties.csv",
    location: function(d) { return d.County }
  },
  precincts: {
    url: "http://results.vote.wa.gov/results/current/export/20141104_AllStatePrecincts.csv",
    location: function(d) { return d.PrecinctCode },
    filter: function(d) { return d.PrecinctCode != -1 }
  }
};

var getResults = function(config, c) {
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
      race: row.Race, //implement some kind of race match system
      candidate: row.Candidate, //implement candidate aliasing
      votes: row.Votes,
      percent: row.PercentageOfTotalVotes,
      source: "Secretary of State",
      location: typeof config.location == "function" ? config.location(row) : config.location
    });
  });
  parser.on("finish", function() {
    c(null, rows);
  });
  request(config.url).pipe(parser);
};

module.exports = {
  statewide: getResults.bind(null, configs.statewide),
  counties: getResults.bind(null, configs.counties),
  precincts: getResults.bind(null, configs.precincts)
};