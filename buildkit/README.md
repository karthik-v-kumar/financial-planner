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

- `makedemo.js`  — writes a sanitized `demo.html` into the repo
                   (fictional data, no keys, no card art). This is the ONLY
                   HTML that belongs in the public repo. It aborts without
                   writing if a replacement's target has moved in the source,
                   or if any term in `demo-map.local.json` survives.
- `verify.js`    — paychecks, paystub withholding, 401k, spending and net worth totals
- `ratecheck.js` — tax engine
- `cardcheck.js` — card credits and offers
- `raisecheck.js`— mid-year raise math
- `phaseout.js`  — SALT and California itemized phase-outs
- `_app.js`      — loads the app under Node for the tests, with the database off

Every test derives its expected values from the plan's own inputs, so none
names a figure from the plan, and each holds for the live file and the demo
alike. `build.sh` runs them against both. Each prints `>>> ALL CHECKS PASSED`
on success.

## The one rule

Commit `demo.html`. Never commit `finance-planner.html`, any snapshot, or any
exported JSON. Confirm `.gitignore` still excludes them before every commit.
