<?php
/**
 * SampleController_broken — REGRESSION state (mutation target).
 *
 * Simulates two defects captured in the observed behaviour (OBS-008, OBS-009):
 *
 *   1. MOQ enforcement DISABLED: orders below minimum quantity are accepted
 *      (maps to the regression in REC-009 — system accepted qty=1 against moq=2)
 *
 *   2. Salesforce case NOT CREATED after order placement: sf_case_id is null
 *      (maps to the regression in REC-003 — SF API timeout, case never written)
 *
 * When this file is swapped in by mutate_and_rerun.sh, stub_mode.txt is set
 * to "broken" and the stub server returns regressed responses.
 *
 * Expected test failures in broken mode:
 *   - MoqEnforcementTest::testOrderBelowMoqIsRejected  (expects 4xx, gets 200)
 *   - SfCaseCreationTest::testOrderPlacementCreatesSalesforceCase (sf_case_id is null)
 */
