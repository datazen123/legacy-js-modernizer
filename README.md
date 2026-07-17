# legacy-js-modernizer

Claude reads a real (synthetic) piece of legacy jQuery + framework-independent
JS - a facility-asset status dashboard - produces a structured migration
assessment, then generates a modern replacement: a clean JS logic module and
a React component. A separate, deterministic Node script then checks that the
modernized logic actually behaves the same as the legacy version on sample
data - Claude doesn't get to grade its own homework.

`data/sample_assets.json` is synthetic sample data written for this demo -
not from any real facility or system. `legacy/generate_report.ps1` is a small
legacy PowerShell script included so Claude can assess and propose a
migration plan for it - that plan is documented only, not implemented, to
keep this repo's scope to the JS/React migration.

## Why this exists

A real, current USFK-area contractor job posting (Parsons Corp, "Software
Developer - Onsite in Korea (USFK)") is explicitly hiring to modernize
geospatial/analytical web applications from PowerShell, Java, and JavaScript
into React. This demo is that exact task, scoped down to something
demonstrable: legacy jQuery + vanilla JS in, explained and modernized with
Claude's help, with the result checked rather than assumed correct.

## Architecture

```
legacy/logic.js        (business rules, callback-style, framework-independent)
legacy/dashboard.js     (jQuery presentation layer, depends on logic.js)
legacy/generate_report.ps1   (unrelated legacy reporting script)
        |
        v
  modernize.py  --(Claude)-->  modernized/analysis.json   (assessment + migration plan)
                                modernized/logic.js         (modern JS, same rules)
                                modernized/Dashboard.jsx     (React, consumes modern logic)
        |
        v
  verify_parity.js  -- deterministic Node script, NOT Claude, checks
                        legacy/logic.js and modernized/logic.js agree on
                        every sample asset's daysSinceCheck/isOverdue/riskLevel
```

**What's actually verified vs. not:** `verify_parity.js` proves the extracted
business logic behaves identically before and after modernization - that's
the meaningful, checkable part of a migration like this. It does **not**
verify that `Dashboard.jsx` renders pixel-identically to the old jQuery
table; that would need a browser/DOM harness this demo doesn't include, and
the README says so rather than implying otherwise.

- `llm_client.py` - thin provider adapter. Anthropic is the tested backend
  used throughout this repo. OpenAI and Ask Sage adapters are included for
  the same interface, but have **not** been run against live credentials in
  this repo - treat them as reference code until verified.
- `modernize.py` - the three Claude calls described above.
- `verify_parity.js` - the actual proof.

## Running it

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in your own ANTHROPIC_API_KEY
export $(grep -v '^#' .env | xargs)
python modernize.py
node verify_parity.js
```

## Deployment path

This demo calls the Anthropic API directly. A production version of this for
a DoD-adjacent client would more likely run through
**[Ask Sage](https://www.asksage.ai/)** - the IL5/IL6-authorized multi-model
gateway built for Defense Industrial Base contractors (`llm_client.py`
includes an `AskSageClient` built from Ask Sage's
[public API docs](https://github.com/Ask-Sage/AskSage-Open-Source-Community),
untested pending an account).

Built with [Claude Code](https://claude.com/claude-code).
