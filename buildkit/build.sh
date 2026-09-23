#!/usr/bin/env bash
# Regenerate the demo and run every test against the live file.
# Usage:  ./buildkit/build.sh [/path/to/finance-planner.html]
# Layout: the live file sits one level ABOVE the repo, so it is outside the
# working tree and cannot be committed even by accident. buildkit lives
# inside the repo and reaches up to it.
#
#   Claude Projects/
#     finance-planner.html   <- live file, never in git
#     financial-planner/     <- the repo
#       buildkit/            <- these scripts
set -e
cd "$(dirname "$0")"
SRC="${1:-../../finance-planner.html}"
if [ ! -f "$SRC" ]; then
  echo "Live file not found at: $SRC" >&2
  echo "Pass the path explicitly: ./build.sh /path/to/finance-planner.html" >&2
  exit 1
fi
echo "Source: $SRC"
echo
runtests(){
  for t in verify ratecheck cardcheck raisecheck phaseout; do
    printf "  %-14s " "$t"
    node "$t.js" "$1" 2>&1 | grep -oE ">>> ALL CHECKS PASSED|>>> [0-9]+ FAILURES" | head -1
  done
}
echo "Running tests against the live file..."
runtests "$SRC"
echo
echo "Regenerating demo..."
node makedemo.js "$SRC"
echo
# The demo is a different household, so the same tests run again on it:
# the fictional figures have to hold together as well as the real ones do.
echo "Running tests against the demo..."
runtests ../demo.html
echo
echo "Done. Commit the regenerated demo.html — never $SRC."
