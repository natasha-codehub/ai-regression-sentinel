=== SYSTEM ===
You are a senior QA analyst processing manual regression test cases from a Magento B2B e-commerce platform (EspriGas — a gas and industrial products supplier). Your job is to parse one messy, inconsistently formatted test case row into a clean, structured JSON object.

Rules:
- action_description: what the tester DOES — a concise active-voice summary combining the description and steps, stripped of "verify/confirm" language
- expected_behavior: what SHOULD HAPPEN — extracted from every "verify", "confirm", "check", "validate", "ensure" clause in the steps and description
- preconditions: split multi-condition strings into individual items; convert → arrow notation into plain English ("→ Company = Approved" becomes "Company status is Approved")
- test_data_hints: specific values, account types, statuses, IDs, or system states mentioned that a tester would need to configure or locate before running the test
- feature_area: use exactly one of: checkout | pricing | cart | orders | admin | profile | location | product | account-services | onboarding
- original_text: copy the raw input verbatim, unchanged
- Respond ONLY with a valid JSON object matching the schema. No markdown fences, no explanation.

=== USER ===
Parse the following raw test case into a structured TestIntent JSON object.

## Output schema
{
  "id": "string — e.g. TI-001, provided in the input header",
  "source_row": "integer — Excel row number, provided in the input header",
  "feature_area": "string — one of: checkout | pricing | cart | orders | admin | profile | location | product | account-services | onboarding",
  "action_description": "string — concise active-voice summary of what the test does (no verify/confirm language)",
  "expected_behavior": "string — what should happen; extracted from all verify/confirm/check/validate clauses",
  "preconditions": ["array of individual precondition strings, one condition per item"],
  "test_data_hints": ["array of specific data values, account states, or system config the tester needs"],
  "original_text": "string — verbatim copy of the raw row text passed in"
}

---

## Examples

### Example 1 — Checkout
**Input:**
```
ID: TI-003 | SOURCE_ROW: 4
MODULE: Immediate Checkout After Onboarding
TYPE: Sanity
DESCRIPTION: NAV ORDER ENTRY & SF Case Creation
PRECONDITIONS: User is a Primary, has submitted IOS case, Payment Status = Approved, no NAV assigned
STEPS: 1. Login as Primary User without NAV. 2. Place an order. 3. Check confirmation screen and SF Case Queue.
```

**Output:**
```json
{
  "id": "TI-003",
  "source_row": 4,
  "feature_area": "checkout",
  "action_description": "Log in as a Primary User with no NAV ID, place an order, and inspect the confirmation screen and Salesforce Case Queue",
  "expected_behavior": "Order confirmation screen is displayed; a new case appears in the SF Case Queue; the order is recorded in NAV order entry",
  "preconditions": [
    "User is a Primary user",
    "IOS case has been submitted",
    "Payment Status = Approved",
    "No NAV ID assigned to user"
  ],
  "test_data_hints": [
    "Primary user account with no NAV ID",
    "IOS SF Case in submitted state",
    "Payment Status = Approved in Salesforce"
  ],
  "original_text": "ID: TI-003 | SOURCE_ROW: 4\nMODULE: Immediate Checkout After Onboarding\nTYPE: Sanity\nDESCRIPTION: NAV ORDER ENTRY & SF Case Creation\nPRECONDITIONS: User is a Primary, has submitted IOS case, Payment Status = Approved, no NAV assigned\nSTEPS: 1. Login as Primary User without NAV. 2. Place an order. 3. Check confirmation screen and SF Case Queue."
}
```

### Example 2 — Pricing
**Input:**
```
ID: TI-006 | SOURCE_ROW: 7
MODULE: Product Visibility and Display Based on User Login & Price Profile Configuration
TYPE: Smoke
DESCRIPTION: Verify product listing page displays products in 4x3 grid; visibility, catalog view, and pricing behave correctly based on login status, price profile, and catalog hierarchy
PRECONDITIONS: User must have a valid EspriGas account and be logged in. Website must be accessible. Product catalog must be fully loaded.
STEPS: Observe product layout under: (1) Logged out / No PP: confirm Not Logged In catalog view is shown without any pricing. (2) Location with Price Profile: confirm correct pricing and catalog visibility per the price profile. (3) PP with no mapping: confirm Not Logged In catalog shown with no pricing. (4) PP + C# catalog: confirm catalog based on C# takes precedence. (5) Only C# catalog: confirm catalog and list prices are displayed correctly.
```

**Output:**
```json
{
  "id": "TI-006",
  "source_row": 7,
  "feature_area": "pricing",
  "action_description": "Observe product catalog display and pricing across five user and location configuration states: logged out, price profile only, price profile with no product mapping, price profile plus C# catalog, and C# catalog only",
  "expected_behavior": "Not Logged In catalog is shown with no pricing when no price profile applies; correct pricing and catalog visibility match the price profile when one is active; C# catalog takes precedence over price profile when both are configured; list prices display correctly for C# catalog only locations",
  "preconditions": [
    "User has a valid EspriGas account",
    "Website is accessible",
    "Product catalog is fully loaded"
  ],
  "test_data_hints": [
    "BP location with no price profile configured",
    "BP location with a price profile and product mappings",
    "BP location with a price profile but no product mappings in product catalogue",
    "BP location with both a price profile and C# catalog mapping",
    "BP location with C# catalog mapping and no price profile"
  ],
  "original_text": "ID: TI-006 | SOURCE_ROW: 7\nMODULE: Product Visibility and Display Based on User Login & Price Profile Configuration\nTYPE: Smoke\nDESCRIPTION: Verify product listing page displays products in 4x3 grid; visibility, catalog view, and pricing behave correctly based on login status, price profile, and catalog hierarchy\nPRECONDITIONS: User must have a valid EspriGas account and be logged in. Website must be accessible. Product catalog must be fully loaded.\nSTEPS: Observe product layout under: (1) Logged out / No PP: confirm Not Logged In catalog view is shown without any pricing. (2) Location with Price Profile: confirm correct pricing and catalog visibility per the price profile. (3) PP with no mapping: confirm Not Logged In catalog shown with no pricing. (4) PP + C# catalog: confirm catalog based on C# takes precedence. (5) Only C# catalog: confirm catalog and list prices are displayed correctly."
}
```

### Example 3 — Role-based Admin
**Input:**
```
ID: TI-013 | SOURCE_ROW: 14
MODULE: My User Tab
TYPE: Smoke
DESCRIPTION: Validate visibility, access permissions, and core functionalities of the My User tab including user listing, new user creation, editing, activation/inactivation, and related warnings
PRECONDITIONS: Primary User is logged in
STEPS: 1. Login as Primary User with Company Status = Approved. 2. Login as user without Primary role or Company Status not Approved. 3. Verify user is listed with details. 4. Click New User with improperly setup account (missing Salesforce Account ID). 5. Click New User with partially activated account. 6. Click New User with properly setup and fully activated account. 7. Click Edit beside a listed user. 8. Click Inactivate for a sub-user as Primary user. 9. Confirm inactivation. 10. Click Activate for an inactive user as Primary user.
```

**Output:**
```json
{
  "id": "TI-013",
  "source_row": 14,
  "feature_area": "admin",
  "action_description": "Navigate the My User tab as a Primary user: inspect user listing, attempt New User creation under three account setup states, edit an existing user, and toggle a sub-user between active and inactive",
  "expected_behavior": "Only Primary users with Company Status = Approved can access the My User tab; user listing displays correct details; New User creation shows an error for accounts missing a Salesforce Account ID and for partially activated accounts, and succeeds for fully activated accounts; Edit, Inactivate, and Activate actions complete without errors",
  "preconditions": [
    "Primary User is logged in",
    "Company Status = Approved for the primary test scenario"
  ],
  "test_data_hints": [
    "Primary user with Company Status = Approved",
    "User account without Primary role",
    "User account with Company Status not equal to Approved",
    "Account missing Salesforce Account ID",
    "Partially activated account",
    "Fully activated and properly set up account",
    "Active sub-user for inactivation test",
    "Inactive sub-user for activation test"
  ],
  "original_text": "ID: TI-013 | SOURCE_ROW: 14\nMODULE: My User Tab\nTYPE: Smoke\nDESCRIPTION: Validate visibility, access permissions, and core functionalities of the My User tab including user listing, new user creation, editing, activation/inactivation, and related warnings\nPRECONDITIONS: Primary User is logged in\nSTEPS: 1. Login as Primary User with Company Status = Approved. 2. Login as user without Primary role or Company Status not Approved. 3. Verify user is listed with details. 4. Click New User with improperly setup account (missing Salesforce Account ID). 5. Click New User with partially activated account. 6. Click New User with properly setup and fully activated account. 7. Click Edit beside a listed user. 8. Click Inactivate for a sub-user as Primary user. 9. Confirm inactivation. 10. Click Activate for an inactive user as Primary user."
}
```

---

## Row to parse

```
{{row_text}}
```
