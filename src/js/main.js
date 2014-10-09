require([
  "components/svg-map/svg-map"
], function() {

  var map = document.querySelector(".demo");
  map.eachCounty(function(shape, name) {
    shape.style.fill = name == "King" ? "green" : "orange";
  });
  map.getState().getCountyData = function(county) {
    return { name: county };
  };

});
