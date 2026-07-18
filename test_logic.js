// Offline unit tests for legacy/logic.js - the legacy baseline itself,
// independent of verify_parity.js (which needs a prior API-generated
// modernized/logic.js to compare against). Uses Node's built-in assert,
// zero extra dependencies.
const assert = require("assert");
const { daysBetween, processAssets } = require("./legacy/logic.js");

// daysBetween
assert.strictEqual(daysBetween("2026-01-01T00:00:00Z", "2026-01-11T00:00:00Z"), 10);
assert.strictEqual(daysBetween("2026-01-11T00:00:00Z", "2026-01-01T00:00:00Z"), 10, "should be symmetric");
assert.strictEqual(daysBetween("2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"), 0);
console.log("daysBetween: OK");

// processAssets - overdue + risk tiering
const now = new Date().toISOString();
const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

const assets = [
  { id: "A-1", name: "Very overdue asset", last_checked: oldDate, check_interval_days: 30, condition_notes: "" },
  { id: "A-2", name: "Fresh asset", last_checked: recentDate, check_interval_days: 30, condition_notes: "" },
  { id: "A-3", name: "Flagged by keyword", last_checked: recentDate, check_interval_days: 30, condition_notes: "unit failed startup test" },
];

processAssets(assets, (result) => {
  const byId = Object.fromEntries(result.map((r) => [r.id, r]));

  assert.strictEqual(byId["A-1"].riskLevel, "high", "200 days overdue on a 30-day interval should be high risk");
  assert.strictEqual(byId["A-1"].isOverdue, true);

  assert.strictEqual(byId["A-2"].riskLevel, "low", "checked 2 days ago on a 30-day interval should be low risk");
  assert.strictEqual(byId["A-2"].isOverdue, false);

  assert.strictEqual(byId["A-3"].riskLevel, "high", "'failed' keyword in condition_notes should force high risk");

  // sorted high -> medium -> low
  const order = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < result.length; i++) {
    assert.ok(order[result[i - 1].riskLevel] <= order[result[i].riskLevel], "results should be sorted by risk descending");
  }

  console.log("processAssets: OK");
  console.log("\nAll test_logic.js assertions passed.");
});
