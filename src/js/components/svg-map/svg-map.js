/*
  Creates a custom element for the SVG maps. Not using Angular for one reason or another.
*/
/* global ich */
define([
  "lib/rsvp/rsvp",
  "savage",
  "icanhaz",
  "registerElement",
  "less!./svg-map.less",
], function(rsvp, savage) {

  var xhrCache = {};

  var xhr = function(url) {
    if (url in xhrCache) {
      return xhrCache[url];
    }
    var promise = new rsvp.Promise(function(ok, fail) {
      var x = new XMLHttpRequest();
      x.open("GET", url);
      x.onerror = fail;
      x.onload = function() {
        ok(x.response || x.responseText);
      };
      x.send();
    });
    xhrCache[url] = promise;
    return promise;
  };

  var qsa = function(el, s) { return Array.prototype.slice.call(el.querySelectorAll(s)) };

  var onHover = function(e) {
    var popup = this.querySelector(".popup");
    if (e.target.tagName != "path" || e.target.getAttribute("class").indexOf("county") == -1) {
      popup.removeAttribute("show");
      return;
    }
    var state = this.getState();
    //if no listener, don't do anything
    if (!state.getCountyData) return;
    state.ready.then(function(self) {
      var svg = self.querySelector("svg");
      var active = qsa(svg, ".active");
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
    var popupBounds = popup.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    popup.style.top = y + 20 + "px";
    if (x + popupBounds.width > bounds.width) {
      popup.style.left = (x - popupBounds.width) + "px";
    } else {
      popup.style.left = x + "px";
    }
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
    this.innerHTML = "";
    state.transclude = ich[templateName];
    delete ich[templateName];
    var self = this;
    state.ready = new rsvp.Promise(function(ok) {
      xhr(src).then(function(response) {
        self.innerHTML = response + "<div class=popup></div>";
        ok(self);
      });
    });
  };
  mapProto.attachedCallback = function() {
    var self = this;
    this.addEventListener("mousemove", onHover);
    this.addEventListener("mouseleave", function() {
      self.querySelector(".popup").removeAttribute("show");
    });
  };
  mapProto.detachedCallback = function() {
    this.removeEventListener("mousemove");
    this.removeEventListener("mouseleave");
  };
  mapProto.eachPath = function(selector, f) {
    var state = this.getState();
    state.ready.then(function(self) {
      var selected = Array.prototype.slice.call(self.querySelectorAll(selector));
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
  mapProto.savage = savage;

  document.registerElement("svg-map", { prototype: mapProto });
});