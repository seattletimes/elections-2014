/*
  Creates a custom element for the SVG maps. Not using Angular for one reason or another.
*/
/* global ich */
define([
  "text!./_svg-map.html",
  "savage",
  "icanhaz",
  "registerElement",
  "less!./svg-map.less"
], function(template, savage) {
  ich.addTemplate("map", template);

  var onHover = function(e) {
    var popup = this.querySelector(".popup");
    if (e.target.tagName != "path" || e.target.getAttribute("class").indexOf("county") == -1) {
      popup.removeAttribute("show");
      return;
    }
    var state = this.getState();
    //if no listener, don't do anything
    if (!state.getCountyData) return;
    state.svg.queryAll(".active").then(function(active) {
      active.forEach(function(el) { savage.removeClass(el, "active") });
      savage.addClass(e.target, "active");
    });
    var key = e.target.getAttribute("data-location");
    popup.setAttribute("show", "");
    if (state.lastHover != key) {
      //we're on a new county, so inject new template output
      var data = state.getCountyData(key);
      popup.innerHTML = state.transclude(data);
      savage.raise(e.target);
    }
    state.lastHover = key;
    var bounds = this.getBoundingClientRect();
    popup.style.top = e.clientY + 20 + "px";
    popup.style.left = e.clientX + 20 + "px";
  };

  var states = {};
  var idCounter = 0;

  var mapProto = Object.create(HTMLElement.prototype);
  //lifecycle: created, attached, detached, attributeChanged
  mapProto.createdCallback = function() {
    var src = this.getAttribute("src");
    var id = idCounter++;
    var templateName = "temp-" + id;
    this.setAttribute("data-instance", id);
    var state = this.getState();
    ich.addTemplate(templateName, this.innerHTML);
    state.transclude = ich[templateName];
    delete ich[templateName];
    this.innerHTML = ich.map({
      src: src
    });
    state.svg = savage(this.querySelector("object"));
  };
  mapProto.attachedCallback = function() {
    var self = this;
    var state = this.getState();
    state.svg.document.then(function(doc) {
      doc.addEventListener("mousemove", onHover.bind(self));
    });
    this.addEventListener("mouseleave", function() {
      self.querySelector(".popup").removeAttribute("show");
    });
  };
  mapProto.detachedCallback = function() {
    var state = this.getState();
    state.svg.document.then(function(doc) {
      doc.removeEventListener("mousemove");
    });
    this.removeEventListener("mouseleave");
  };
  mapProto.svg = null;
  mapProto.eachCounty = function(f) {
    var state = this.getState();
    state.svg.queryAll(".county").then(function(selected) {
      selected.forEach(function(element, i) {
        var location = element.getAttribute("data-location");
        f(element, location);
      });
    });
  };
  mapProto.getState = function(key) {
    var instance = this.getAttribute("data-instance");
    if (!states[instance]) {
      states[instance] = {};
    }
    if (key) {
      return states[instance][key];
    }
    return states[instance];
  };
  mapProto.setTemplate = function(str) {
    var state = this.getState();
    ich.addTemplate("temp", str);
    state.transclude = ich.temp;
    delete ich.temp;
  };

  document.registerElement("svg-map", { prototype: mapProto });
});