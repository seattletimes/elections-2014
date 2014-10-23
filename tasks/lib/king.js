var fs = require("fs");
var request = require("request");

var url = "http://your.kingcounty.gov/elections/2014/nov-general/results/pi.txt";

var parser = {
  index: 0,
  mode: "search",
  buffer: null,
  parsed: [],
  parseLine: function(line) {
    switch (this.mode) {

    case "search":
      if (line.match(/^\s{7}\w/)) {
        //matched the start of a race
        if (this.buffer) {
          console.error("Buffer not cleared!", this.buffer);
        }
        this.buffer = {
          name: line.trim(),
          results: []
        };
        this.mode = "race";
      }
      break;

    case "race":
      //blank lines should push the buffer and reset the parser, so should bad indentation
      if (!line.trim() || line.match(/^\s{7}\w/)) {
        this.mode = "search";
        this.parsed.push(this.buffer);
        this.buffer = null;
      } else if (line.match(/\d%$/)) { //result lines end with percentages
        line = line.trim();
        var matches = line.match(/([\s\S]+?)\s{2,}\w+\s+([\d.]+)\s+([\d.]+)%/);
        var result = {
          candidate: matches[1],
          votes: matches[2] * 1,
          percent: matches[3] * 1
        };
        this.buffer.results.push(result);
      }
      break;


    }
  },
  parse: function(doc) {
    var lines = doc.replace(/\r/g, "").split("\n");
    while (this.index < lines.length) {
      var line = lines[this.index];
      var result = this.parseLine(line);
      if (!result) {
        this.index++;
      }
    }
    return this.parsed;
  }
};

var getData = function(c) {
  request(url, function(err, response, body) {
    var result = parser.parse(body);
    c(null, result);
  });
};

module.exports = getData;