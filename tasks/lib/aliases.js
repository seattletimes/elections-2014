//tk: require() the candidate sheet data

var candidates = {};
var sheet = require("../../json/Election2014_Candidates.json");
sheet.forEach(function(person) {
  candidates[person.name] = person;
});

module.exports = {
  antialias: function(name) {
    return name;
  },
  getCandidateInfo: function(name) {
    return candidates[name];
  }
};