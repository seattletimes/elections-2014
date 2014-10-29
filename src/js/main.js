/* global $ */

require([
  "components/svg-map/svg-map",
  "jquery"
], function() {

  var yes = ["yes", "approved", "maintained"];

  $("svg-map").each(function(i, map) {
    var raceID = map.getAttribute("data-race");
    var data = window.mapData[raceID];
    if (Object.keys(data).length) {
      map.eachPath(".county", function(shape, name) {
        var result = data[name];
        if (result.winner.party) {
          map.savage.addClass(shape, result.winner.party == "D" ? "dem" : "rep");
        } else {
          var option = result.winner.candidate.toLowerCase();
          map.savage.addClass(shape, yes.indexOf(option) > -1 ? "yes" : "no");
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
    var section = $(href);
    section.show();
    if (window.history && window.history.replaceState) window.history.replaceState(href, "", href);
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
