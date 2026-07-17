// Deterministic behavioral-parity check: feeds the same synthetic asset data
// through the legacy business logic and the Claude-generated modernized
// business logic, and diffs the fields that actually matter. This script,
// not Claude, is the source of truth for whether the migration is correct.
const fs = require("fs");
const path = require("path");

const legacy = require("./legacy/logic.js");
const modernPath = path.join(__dirname, "modernized", "logic.js");

if (!fs.existsSync(modernPath)) {
  console.error("modernized/logic.js not found - run `python modernize.py` first.");
  process.exit(1);
}
const modern = require(modernPath);

const assets = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "sample_assets.json"), "utf8"));

function runLegacy(assets) {
  let result;
  legacy.processAssets(assets, (out) => {
    result = out;
  });
  return result;
}

const legacyResult = runLegacy(assets).slice().sort((a, b) => a.id.localeCompare(b.id));
const modernResult = modern
  .processAssets(assets)
  .slice()
  .sort((a, b) => a.id.localeCompare(b.id));

const FIELDS = ["id", "daysSinceCheck", "isOverdue", "riskLevel"];
let mismatches = 0;

if (legacyResult.length !== modernResult.length) {
  console.error(`Row count mismatch: legacy=${legacyResult.length} modern=${modernResult.length}`);
  mismatches++;
}

for (let i = 0; i < Math.min(legacyResult.length, modernResult.length); i++) {
  const l = legacyResult[i];
  const m = modernResult[i];
  for (const field of FIELDS) {
    if (l[field] !== m[field]) {
      console.error(`Mismatch on ${l.id || m.id}.${field}: legacy=${JSON.stringify(l[field])} modern=${JSON.stringify(m[field])}`);
      mismatches++;
    }
  }
}

if (mismatches === 0) {
  console.log(`PARITY OK - ${legacyResult.length} assets, legacy and modernized logic agree on all fields: ${FIELDS.join(", ")}.`);
  process.exit(0);
} else {
  console.error(`PARITY FAILED - ${mismatches} mismatch(es) found.`);
  process.exit(1);
}
