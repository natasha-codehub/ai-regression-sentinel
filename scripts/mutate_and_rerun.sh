#!/usr/bin/env bash
# mutate_and_rerun.sh
# Swaps SampleController.php for the broken version, re-runs the test suite,
# confirms at least one test fails, then restores the original.
# Run with Git Bash or WSL on Windows.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS="$SCRIPT_DIR/../data/inputs/target_code"
MODE_FILE="$HARNESS/stub_mode.txt"
CONTROLLER="$HARNESS/SampleController.php"
BROKEN="$HARNESS/SampleController_broken.php"
LOG="$SCRIPT_DIR/../data/outputs/test_run_broken.log"
NORMAL_LOG="$SCRIPT_DIR/../data/outputs/test_run.log"

echo "=== Sentinel · Mutation Run ==="

# ── pre-check: normal run log must exist ──────────────────────────────────────
if [[ ! -f "$NORMAL_LOG" ]]; then
    echo "ERROR: run run_generated_tests.sh first to establish a baseline."
    exit 1
fi

# Verify stub server is reachable
if ! curl -sf "http://localhost:8080/rest/V1/carts/mine/payment-methods" > /dev/null 2>&1; then
    echo "ERROR: stub server not reachable on localhost:8080"
    echo "Start it first:  python scripts/stub_server.py"
    exit 1
fi

# ── apply mutation ────────────────────────────────────────────────────────────
echo ""
echo "Applying mutation:"
echo "  cp $CONTROLLER → $CONTROLLER.bak"
cp "$CONTROLLER" "$CONTROLLER.bak"

echo "  cp $BROKEN → $CONTROLLER"
cp "$BROKEN" "$CONTROLLER"

echo "  stub_mode.txt → broken"
echo "broken" > "$MODE_FILE"
echo ""

# ── run tests ─────────────────────────────────────────────────────────────────
echo "=== MUTATION TEST RUN ===" | tee "$LOG"
date | tee -a "$LOG"
echo "" | tee -a "$LOG"

cd "$HARNESS"
./vendor/bin/phpunit --colors=never 2>&1 | tee -a "$LOG"
PHPUNIT_EXIT=${PIPESTATUS[0]}

# ── restore ───────────────────────────────────────────────────────────────────
echo "" | tee -a "$LOG"
echo "Restoring original state..." | tee -a "$LOG"
cp "$CONTROLLER.bak" "$CONTROLLER"
rm "$CONTROLLER.bak"
echo "normal" > "$MODE_FILE"
echo "stub_mode.txt → normal" | tee -a "$LOG"

# ── verdict ───────────────────────────────────────────────────────────────────
echo ""
if [[ $PHPUNIT_EXIT -ne 0 ]]; then
    echo "✓ MUTATION CONFIRMED: at least one test failed (PHPUnit exit=$PHPUNIT_EXIT)"
    echo "  Expected failures:"
    echo "    MoqEnforcementTest::testOrderBelowMoqIsRejected"
    echo "    SfCaseCreationTest::testOrderPlacementCreatesSalesforceCase"
    echo ""
    echo "Full log: $LOG"
    exit 0
else
    echo "✗ MUTATION NOT DETECTED: all tests passed in broken mode."
    echo "  The tests are not effectively catching the regression."
    echo "  Check: $LOG"
    exit 1
fi
