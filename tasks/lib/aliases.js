var fs = require("fs");

var candidates = {};
var sheet;

module.exports = {
  antialias: function(name) {
    return name;
  },
  getCandidateInfo: function(name) {
    if (!sheet) {
      sheet = JSON.parse(fs.readFileSync("./json/Election2014_Candidates.json", { encoding: "utf8" }));
      sheet.forEach(function(person) {
        candidates[person.name] = person;
      });
    }
    return candidates[name] || {};
  }
};