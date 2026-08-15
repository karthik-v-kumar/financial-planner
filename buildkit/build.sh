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
echo "Running tests..."
for t in verify ratecheck cardcheck raisecheck phaseout; do
  printf "  %-14s " "$t"
  node "$t.js" "$SRC" 2>&1 | grep -oE ">>> ALL CHECKS PASSED|>>> [0-9]+ FAILURES" | head -1
done
echo
echo "Regenerating demo..."
node makedemo.js "$SRC"
echo
echo "Done. Commit the regenerated demo.html — never $SRC."
