define([
  "lib/rsvp/rsvp"
], function(rsvp) {

  //Simple, promise-based interaction with SVG documents imported via <object>

  var Savage = function(root) {
    if (!(this instanceof Savage)) {
      return new Savage(root);
    }
    this.root = root;
    this.document = new rsvp.Promise(function(ok, fail) {
      root.addEventListener("load", function() {
        ok(root.contentDocument);
      });
    });
  };

  Savage.prototype = {
    query: function(q) {
      return this.document.then(function(doc) {
        return doc.querySelector(q);
      });
    },
    queryAll: function(q) {
      return this.document.then(function(doc) {
        return [].slice.call(doc.querySelectorAll(q));
      });
    }
  };

  //lifts up an element for stroke, since z-index doesn't apply to SVG
  Savage.raise = function(element) {
    element.parentNode.appendChild(element);
  };

  return Savage;

});