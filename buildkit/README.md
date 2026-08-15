# Build kit

Scripts that regenerate the public demo and test the app. They read the LIVE
file (`finance-planner.html`), which is git-ignored and must never be
committed. Keep the live file OUTSIDE this repo — one level up is the
convention these scripts default to.

## Regenerate the demo and run all tests

    ./build.sh /path/to/finance-planner.html

With no argument it looks for `../finance-planner.html`.

## Individual scripts

Each takes the source file as its first argument (or the `PLANNER_SRC` env
var), defaulting to `finance-planner.html` in the current directory.

- `makedemo.js`  — writes a sanitized `demo.html` next to the source
                   (fictional data, no keys, no card art). This is the ONLY
                   HTML that belongs in the public repo.
- `verify.js`    — income and spending totals
- `ratecheck.js` — tax engine (self-deriving, no hardcoded expected values)
- `cardcheck.js` — card credits and offers
- `raisecheck.js`— mid-year raise math
- `phaseout.js`  — SALT and California itemized phase-outs

Each test prints `>>> ALL CHECKS PASSED` on success.

## The one rule

Commit `demo.html`. Never commit `finance-planner.html`, any snapshot, or any
exported JSON. Confirm `.gitignore` still excludes them before every commit.
