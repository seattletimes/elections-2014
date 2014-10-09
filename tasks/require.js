/*

Builds a source package, starting from src/js/main.js

*/

var r = require("requirejs");
var shell = require("shelljs");
var project = require("../project.json");

module.exports = function(grunt) {

  grunt.registerTask("amd", "Compile AMD modules to build/main.js", function() {
    var c = this.async();

    var config = {
      baseUrl: "src/js",
      name: "main",
      include: ["almond.js"],
      out: "build/app.js",
      generateSourceMaps: true,
      preserveLicenseComments: false,
      optimize: "none",
      stubModules: ["text", "less"],
      //common paths for bower packages
      //luckily, require won't complain unless we use them
      paths: {
        share: "lib/share.min", //standard share widget
        jquery: "lib/jquery/dist/jquery.min",
        pym: "lib/seattletimes-pym/src/pym", //custom Pym branch
        angular: "lib/angular/angular.min",
        leaflet: "lib/leaflet/dist/leaflet",
        icanhaz: "lib/icanhaz/ICanHaz.min",
        registerElement: "lib/document-register-element/build/document-register-element" //custom element polyfill
      }
    };

    for (var key in project.require) {
      config[key] = project.require[key];
    }

    //build an optimized app bundle
    //include almond for resource loading
    r.optimize(config, c);
  })

};
