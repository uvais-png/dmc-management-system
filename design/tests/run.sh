#!/bin/sh
# Runs every design test. Usage: sh run.sh (from this folder). Needs Node 18+.
cd "$(dirname "$0")" || exit 1
P=../project
fail=0
run() {
  out=$(node "$@" 2>&1)
  code=$?
  n=$(printf '%s\n' "$out" | grep -c '^FAIL')
  okc=$(printf '%s\n' "$out" | grep -c '^ok')
  if [ "$code" -ne 0 ] || [ "$n" -ne 0 ]; then fail=1; printf 'FAILED  %s (%s failed)\n' "$1" "$n"; printf '%s\n' "$out" | grep '^FAIL'; elif [ "$okc" -eq 0 ]; then printf 'ran     %s (smoke run, no assertions)\n' "$1"; else printf 'passed  %s (%s checks)\n' "$1" "$okc"; fi
}
run flow.js $P/Lead.dc.html
run guide.js $P/GuideApp.dc.html
run main.js $P/Main.dc.html
run shared.js
run bo.js
run bridge.js
run tables.js
exit $fail
