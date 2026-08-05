# Context for Claude Code working in this repo

This repo is one of a **10-repo public portfolio** (github.com/datazen123)
demonstrating real, live-verified agentic AI engineering for a specific
DoD-contractor job pursuit. Full README below covers this repo in detail;
this file covers conventions and status a coding agent needs before making
changes.

## Status: deprioritized (2026-07-27)

The user explicitly judged this repo "serves no immediate purpose" for
this pursuit and asked to leave it behind. **Do not invest further work
here unless the user explicitly asks again.** It stays published as-is.

There is one **dangling, uncommitted, untested local edit** sitting in the
working tree (auto-wiring `verify_parity.js`'s parity check into
`modernize.py` with a bounded correction retry, instead of leaving it as a
manual follow-up step). It was mid-flight when priorities shifted. No
decision has been made on it either way - it's harmless (never pushed,
never claimed as done), just noted here so it isn't mistaken for either a
finished feature or something to silently discard. If picking this repo
back up, that edit is the natural next step to finish (tests + live-verify
+ README update) or to explicitly revert.

## This repo's role (for context, if resumed)

Claude modernizes legacy jQuery/JS to React; a separate deterministic Node
script checks behavioral parity, not Claude's own claim. Real USFK job
posting evidence (Parsons Corp), but no confirmed contract award - honestly
scoped as job-posting-level, not award-level, evidence.

## Non-negotiable discipline this whole portfolio follows

Same as every other repo in this portfolio - see any actively-worked
repo's `CLAUDE.md` (e.g. `network-config-drift-detector`) for the full
list, or this portfolio's private cross-repo context repo for the master
version.
