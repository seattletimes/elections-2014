var fs = require("fs");
var request = require("request");
var project = require("../../project.json");

var url = "http://your.kingcounty.gov/elections/2014/nov-general/results/pi.txt";

var parser = {
  index: 0,
  mode: "init",
  buffer: null,
  parsed: [],
  regex: {
    nameRow: null,
    result: /([\s\S]+?)\s{2,}\w+\s+([\d.]+)\s+([\d.]+)%/
  },
  findNonBlank: function(index) {
    while (index < this.lines.length) {
      var line = this.lines[index];
      if (line.trim()) {
        return line;
      }
      index++;
    }
  },
  parseLine: function(line) {
    switch (this.mode) {

    case "search":
      if (line.match(this.regex.nameRow)) {
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
      //indentation changes reset the buffer, but blank lines do not
      if (!line.trim()) return;
      if (line.match(this.regex.nameRow)) {
        this.mode = "search";
        this.parsed.push(this.buffer);
        this.buffer = null;
        return true;
      } else if (line.match(/\d%$/)) { //result lines end with percentages
        line = line.trim();
        var matches = line.match(this.regex.result);
        var result = {
          candidate: matches[1],
          votes: matches[2] * 1,
          percent: matches[3] * 1
        };
        this.buffer.results.push(result);
      }
      break;

    //start by looking for the first race name
    case "init":
      if (line.match(/nov.*4, 2014/i)) {
        var next = this.findNonBlank(this.index + 1);
        var padding = next.match(/^\s+/)[0];
        //we build a custom regex to handle it in case they change their indentation scheme
        this.regex.nameRow = new RegExp("^" + padding + "\\w");
        this.mode = "search";
      }

    }
  },
  parse: function(doc) {
    var lines = this.lines = doc.replace(/\r/g, "").split("\n");
    while (this.index < lines.length) {
      var line = lines[this.index];
      var result = this.parseLine(line);
      if (!result) {
        this.index++;
      }
    }
    //push remaining races in the buffer over to the parsed list
    if (this.buffer) {
      this.parsed.push(this.buffer);
    }
    return this.parsed;
  }
};

var getData = function(c) {
  var cache = "./temp/king.json";
  if (project.caching && fs.existsSync(cache)) {
    if (fs.statSync(cache).mtime > (new Date(Date.now() - 5 * 60 * 1000))) {
      var data = JSON.parse(fs.readFileSync(cache));
      return c(null, data);
    }
  }
  request(url, function(err, response, body) {
    var result = parser.parse(body);
    // result.forEach(function(row) {
    //   console.log(row.name, row.results.map(function(result) { return result.candidate }));
    // });
    if (project.caching) {
      if (!fs.existsSync("./temp")) {
        fs.mkdirSync("./temp");
      }
      fs.writeFileSync(cache, JSON.stringify(result, null, 2));
    }
    c(null, result);
  });
};

module.exports = getData;