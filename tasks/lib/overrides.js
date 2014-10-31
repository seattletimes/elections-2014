var alias = require("./aliases");

exports.process = function(sheet, races) {

  var overrides = {};
  sheet.forEach(function(row) {
    var candidate = alias.getCandidateInfo(row.name);
    if (!overrides[row.race]) {
      overrides[row.race] = [];
    }
    overrides[row.race].push({
      race: row.race,
      candidate: row.name,
      party: candidate.party,
      incumbent: candidate.incumbent,
      votes: row.votes,
      percent: row.percent,
      source: "Override",
      location: ""
    });

    //apply overrides to the races
    for (var key in overrides) {
      races[key].results = overrides[key];
    }

  });

};