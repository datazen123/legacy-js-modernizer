// asset status logic - do not touch, nobody remembers exactly how this works
// last real edit ~2018 per git blame on the old system

var _cache = {};
var _riskCounter = 0;

function daysBetween(d1, d2) {
  var one_day = 1000 * 60 * 60 * 24;
  var date1 = new Date(d1);
  var date2 = new Date(d2);
  return Math.round(Math.abs((date2.getTime() - date1.getTime()) / one_day));
}

function getRisk(asset, cb) {
  var days = daysBetween(asset.last_checked, new Date().toISOString());
  var overdue = days > asset.check_interval_days;
  var ratio = days / asset.check_interval_days;
  var risk;
  if (ratio >= 2) {
    risk = "high";
  } else if (ratio >= 1) {
    risk = "medium";
  } else {
    risk = "low";
  }
  // bump risk if condition_notes mentions certain keywords, old hack from 2017
  if (asset.condition_notes && asset.condition_notes.toLowerCase().indexOf("fail") !== -1) {
    risk = "high";
  }
  _riskCounter++;
  _cache[asset.id] = risk;
  cb(null, { days: days, overdue: overdue, risk: risk });
}

// main entry point - synchronous despite the callback, don't ask why
function processAssets(assets, callback) {
  var out = [];
  for (var i = 0; i < assets.length; i++) {
    (function (asset) {
      getRisk(asset, function (err, result) {
        var row = {};
        for (var k in asset) {
          row[k] = asset[k];
        }
        row.daysSinceCheck = result.days;
        row.isOverdue = result.overdue;
        row.riskLevel = result.risk;
        out.push(row);
      });
    })(assets[i]);
  }
  var order = { high: 0, medium: 1, low: 2 };
  out.sort(function (a, b) {
    return order[a.riskLevel] - order[b.riskLevel];
  });
  callback(out);
}

if (typeof module !== "undefined") {
  module.exports = { processAssets: processAssets, daysBetween: daysBetween };
}
