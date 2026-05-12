#!/usr/bin/env bash
# run_generated_tests.sh
# Copies generated PHP tests into the harness and runs PHPUnit.
# Requires: stub server running on localhost:8080, PHP, Composer
# Run with Git Bash or WSL on Windows.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS="$SCRIPT_DIR/../data/inputs/target_code"
GENERATED="$SCRIPT_DIR/../data/outputs/generated_tests"
LOG="$SCRIPT_DIR/../data/outputs/test_run.log"

echo "=== Sentinel · Run Generated Tests ==="
echo "Harness : $HARNESS"
echo "Tests   : $GENERATED"
echo "Log     : $LOG"
echo ""

# Verify stub server is reachable
if ! curl -sf "http://localhost:8080/rest/V1/carts/mine/payment-methods" > /dev/null 2>&1; then
    echo "ERROR: stub server not reachable on localhost:8080"
    echo "Start it first:  python scripts/stub_server.py"
    exit 1
fi

# Copy generated tests into harness
mkdir -p "$HARNESS/tests"
cp "$GENERATED"/*.php "$HARNESS/tests/"
echo "Copied $(ls "$GENERATED"/*.php | wc -l | tr -d ' ') test file(s) into $HARNESS/tests/"

# Run PHPUnit
cd "$HARNESS"
echo ""
./vendor/bin/phpunit --colors=never 2>&1 | tee "$LOG"
EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "=== Done — exit code $EXIT_CODE ==="
echo "Full log: $LOG"
exit $EXIT_CODE
