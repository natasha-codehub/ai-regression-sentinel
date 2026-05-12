<?php
/**
 * SampleController — CURRENT (fixed) system state.
 *
 * This file is a mutation marker, not executable code.
 * The stub server (scripts/stub_server.py) reads stub_mode.txt to determine
 * its behaviour. When this file is active, stub_mode.txt = "normal":
 *
 *   - MOQ enforcement ACTIVE: orders below minimum quantity → HTTP 422
 *   - Salesforce case CREATED after order placement (sf_case_id is not null)
 *   - nav_order_id populated on every successful order
 *
 * To simulate the regression, run: bash scripts/mutate_and_rerun.sh
 * That script swaps this file for SampleController_broken.php and re-runs
 * the test suite. At least testOrderBelowMoqIsRejected and
 * testOrderPlacementCreatesSalesforceCase should fail.
 */
