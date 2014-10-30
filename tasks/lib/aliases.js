var fs = require("fs");

var candidates = {};
var cSheet;
var aSheet;
var aliases = {};

module.exports = {
  antialias: function(name) {
    if (!aSheet) {
      aSheet = JSON.parse(fs.readFileSync("./json/Election2014_Aliases.json", { encoding: "utf8"}));
      aSheet.forEach(function(row) {
        aliases[row.alias] = row.name;
      });
    }
    return aliases[name] || name;
  },
  getCandidateInfo: function(name) {
    if (!cSheet) {
      cSheet = JSON.parse(fs.readFileSync("./json/Election2014_Candidates.json", { encoding: "utf8" }));
      cSheet.forEach(function(person) {
        candidates[person.name] = person;
      });
    }
    return candidates[name] || {};
  }
};