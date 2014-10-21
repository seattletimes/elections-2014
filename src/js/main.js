/* global $ */

require([
  "components/svg-map/svg-map",
  "jquery"
], function() {

  // var map = document.querySelector(".demo");
  // map.eachCounty(function(shape, name) {
  //   shape.style.fill = name == "King" ? "green" : "orange";
  // });
  // map.getState().getCountyData = function(county) {
  //   return { name: county };
  // };

  $(document.body).on("click", "a.tab", function(e) {
    e.preventDefault();
    var href = this.getAttribute("href");
    $(".tab.active").removeClass("active");
    $(this).addClass("active");
    $("section.category").hide();
    $(href).show();
  });

  $("a.tab:first").click();

  document.body.className = "";

});
