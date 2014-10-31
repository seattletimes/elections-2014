var request = require("request");
var fs = require("fs");
var csv = require("csv");

var url = "http://results.vote.wa.gov/results/current/export/MediaVoterTurnout.txt";

module.exports = function(c) {
  var parser = csv.parse({
    columns: true,
    auto_parse: true,
    delimiter: "\t"
  });
  var turnout = {};
  parser.on("data", function(line) {
    var county = line.CountyName;
    turnout[county] = line;
  });
  parser.on("finish", function() {
    c(null, turnout);
  });
  var req = request(url);
  req.pipe(parser);
  if (!fs.existsSync("./temp")) {
    fs.mkdirSync("temp");
  }
  var temp = fs.createWriteStream("./temp/turnout.txt");
  req.pipe(temp);
};