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

  $("svg-map").each(function(i, map) {
    var raceID = map.getAttribute("data-race");
    var data = window.mapData[raceID];
    if (Object.keys(data).length) {
      map.eachCounty(function(shape, name) {
        var result = data[name];
        if (result.winner.party) {
          shape.style.fill = result.winner.party == "D" ? "blue" : "red";
        } else {
          shape.style.fill = result.winner.candidate == "Yes" ? "green" : "orange";
        }
      });
      map.getState().getCountyData = function(county) {
        return data[county];
      };
    }
  });

  $(document.body).on("click", "a.tab", function(e) {
    e.preventDefault();
    var href = this.getAttribute("href");
    $(".tab.active").removeClass("active");
    $(this).addClass("active");
    $("section.category").hide();
    $(href).show();
    window.history.replaceState(href, "", href);
  });

  var hash = window.location.hash;
  if (hash) {
    //restore place from the URL hash
    var selector = "a.tab[href=%]".replace("%", hash);
    $(selector).click();
  } else {
    $("a.tab:first").click();
  }

  document.body.className = "";

});
