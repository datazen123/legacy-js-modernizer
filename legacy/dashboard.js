// facility asset dashboard - jQuery, circa 2017
// pulls asset list from /api/assets, renders table, lets you filter by risk
// NOT executed anywhere in this repo - included so the modernization tool has
// real legacy presentation-layer code to read, same as it would on the job.

var assetsLogic = require("./logic.js");
var currentFilter = "all";
var lastLoadedAssets = [];

$(document).ready(function () {
  loadAssets();

  $("#filter-select").on("change", function () {
    currentFilter = $(this).val();
    renderTable(lastLoadedAssets);
  });

  $("#refresh-btn").click(function () {
    loadAssets();
  });
});

function loadAssets() {
  $.ajax({
    url: "/api/assets",
    method: "GET",
    success: function (data) {
      assetsLogic.processAssets(data, function (processed) {
        lastLoadedAssets = processed;
        renderTable(processed);
      });
    },
    error: function (xhr) {
      alert("could not load assets: " + xhr.status);
    },
  });
}

function renderTable(assets) {
  var $tbody = $("#asset-table tbody");
  $tbody.empty();
  for (var i = 0; i < assets.length; i++) {
    var a = assets[i];
    if (currentFilter !== "all" && a.riskLevel !== currentFilter) {
      continue;
    }
    var rowClass =
      a.riskLevel === "high" ? "row-danger" : a.riskLevel === "medium" ? "row-warn" : "row-ok";
    var $row = $(
      '<tr class="' +
        rowClass +
        '"><td>' +
        a.id +
        "</td><td>" +
        a.name +
        "</td><td>" +
        a.category +
        "</td><td>" +
        a.daysSinceCheck +
        "</td><td>" +
        a.riskLevel.toUpperCase() +
        "</td></tr>"
    );
    $tbody.append($row);
  }
}
