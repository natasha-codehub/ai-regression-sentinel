"""Build per-test trace JSON files for Chapter C (Trace & Steerability UI).

No Claude API calls — assembles real pipeline outputs with clearly-marked
synthetic placeholders for fields that were not tracked.

Reads:  data/outputs/01_test_intents.json
        data/outputs/02_reconciliation.json
        data/outputs/03_generation.json
        data/outputs/04_eval_scores.json
        data/fixtures/observed_behavior.json
Writes: data/outputs/traces/<test_id>_trace.json  (one per generated test)
        ui/public/data/                            (all output JSONs for React)
        ui/public/data/traces/                     (trace files)
        ui/public/data/manifest.json               (index of all available files)
"""

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from rich import print as rprint
from rich.rule import Rule

BASE_DIR = Path(__file__).parent.parent
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
FIXTURES_DIR = BASE_DIR / "data" / "fixtures"
TRACES_DIR = OUTPUTS_DIR / "traces"
UI_DATA_DIR = BASE_DIR / "ui" / "public" / "data"

# ---------------------------------------------------------------------------
# Synthetic data constants
# All fields sourced from here must have _demo_synthetic: true in the output.
# ---------------------------------------------------------------------------

STEERING_RULES = {
    "RULE-001": {
        "rule_id": "RULE-001",
        "rule_text": "Always cite source file and line number in test method docblock for traceability.",
        "set_on": "2026-05-01T09:00:00Z",
        "set_by": "natasha.agarwal@company.com",
        "_demo_synthetic": True,
    },
    "RULE-002": {
        "rule_id": "RULE-002",
        "rule_text": "Prefer assertSame over assertEquals for HTTP status code assertions (strict type safety).",
        "set_on": "2026-05-01T09:00:00Z",
        "set_by": "natasha.agarwal@company.com",
        "_demo_synthetic": True,
    },
    "RULE-003": {
        "rule_id": "RULE-003",
        "rule_text": "Flag tests with non-deterministic helpers (rand, time, uniqid) in eval notes; gate at WARN minimum.",
        "set_on": "2026-05-02T14:30:00Z",
        "set_by": "natasha.agarwal@company.com",
        "_demo_synthetic": True,
    },
    "RULE-004": {
        "rule_id": "RULE-004",
        "rule_text": "All auth tokens must be fetched in setUp(), never inline inside individual test methods.",
        "set_on": "2026-05-03T11:15:00Z",
        "set_by": "natasha.agarwal@company.com",
        "_demo_synthetic": True,
    },
    "RULE-005": {
        "rule_id": "RULE-005",
        "rule_text": "Use assertStringContainsString for error message assertions, never assertContains on strings.",
        "set_on": "2026-05-04T08:45:00Z",
        "set_by": "natasha.agarwal@company.com",
        "_demo_synthetic": True,
    },
}

# Per-test synthetic data keyed by generation ID
SYNTHETIC = {
    "GEN-001": {
        "generation": {
            "tokens_in": 3847,
            "tokens_out": 892,
            "latency_ms": 6240,
            "attempt_number": 1,
            "alternatives_rejected": [
                {
                    "draft_summary": "Initial draft omitted the group_id fallback path entirely.",
                    "reason_rejected": "Save.php line 80-82 implements a critical fallback when group_id is absent; a test that ignores it has low coverage delta.",
                    "_demo_synthetic": True,
                }
            ],
        },
        "classification": {
            "alternatives_considered": [
                {"level": "unit", "reason_rejected": "Would require mocking the Magento DI container, ObjectManager, and session — integration value too low relative to mocking cost.", "_demo_synthetic": True},
                {"level": "e2e", "reason_rejected": "Browser automation overhead unjustified for a single POST endpoint smoke check; E2E reserved for full user flows.", "_demo_synthetic": True},
            ]
        },
        "validation": {
            "ran_against_current": True,
            "mutation_caught": True,
            "flake_signals": [],
            "_demo_synthetic": True,
        },
        "steering_signals_applied": ["RULE-001", "RULE-002"],
    },
    "GEN-003": {
        "generation": {
            "tokens_in": 3421,
            "tokens_out": 764,
            "latency_ms": 5830,
            "attempt_number": 1,
            "alternatives_rejected": [],
        },
        "classification": {
            "alternatives_considered": [
                {"level": "unit", "reason_rejected": "Salesforce integration is a side effect of order placement — unit tests cannot assert on the SF case creation without mocking the entire Salesforce client.", "_demo_synthetic": True},
                {"level": "contract", "reason_rejected": "Contract testing requires a Salesforce sandbox provider; out of scope for the current demo.", "_demo_synthetic": True},
            ]
        },
        "validation": {
            "ran_against_current": True,
            "mutation_caught": True,
            "flake_signals": [
                {
                    "type": "external_dependency",
                    "detail": "Salesforce API returned a 503 timeout in 1 of 3 test runs — test is a flaky candidate when SF is under load.",
                    "_demo_synthetic": True,
                }
            ],
            "_demo_synthetic": True,
        },
        "steering_signals_applied": ["RULE-001"],
    },
    "GEN-009": {
        "generation": {
            "tokens_in": 4103,
            "tokens_out": 1038,
            "latency_ms": 7120,
            "attempt_number": 1,
            "alternatives_rejected": [
                {
                    "draft_summary": "First draft asserted assertSame(200) for below-MOQ order, treating the regression as expected behaviour.",
                    "reason_rejected": "Reconciliation is behavior_regressed — test must assert HTTP 4xx for below-MOQ, not 200. Draft inverted the signal.",
                    "_demo_synthetic": True,
                }
            ],
        },
        "classification": {
            "alternatives_considered": [
                {"level": "unit", "reason_rejected": "MOQ enforcement fires inside the Magento checkout pipeline — unit testing requires mocking quote, cart, and CSJ repositories which obscures the actual regression path.", "_demo_synthetic": True},
                {"level": "e2e", "reason_rejected": "MOQ validation is a REST API concern; E2E via browser cannot easily assert on raw HTTP status codes or inspect the exact rejection message.", "_demo_synthetic": True},
            ]
        },
        "validation": {
            "ran_against_current": True,
            "mutation_caught": True,
            "flake_signals": [],
            "_demo_synthetic": True,
        },
        "steering_signals_applied": ["RULE-002", "RULE-005"],
    },
    "GEN-010": {
        "generation": {
            "tokens_in": 3692,
            "tokens_out": 847,
            "latency_ms": 6480,
            "attempt_number": 1,
            "alternatives_rejected": [],
        },
        "classification": {
            "alternatives_considered": [
                {"level": "unit", "reason_rejected": "PaymentMethods::delete interacts with customerSession, helper, and Stripe SDK — full mocking graph is too large to be maintainable.", "_demo_synthetic": True},
                {"level": "e2e", "reason_rejected": "Stripe payment method management requires a Stripe test-mode browser session; not available in stub environment.", "_demo_synthetic": True},
            ]
        },
        "validation": {
            "ran_against_current": True,
            "mutation_caught": False,
            "mutation_notes": "A mutation inverting the status check (>= 200 to != 200) was not caught because testCannotDeletePaymentMethodWithOpenOrder uses assertContains([200, 302]) — too wide a range to catch the mutation.",
            "flake_signals": [],
            "_demo_synthetic": True,
        },
        "steering_signals_applied": ["RULE-004"],
    },
    "GEN-013": {
        "generation": {
            "tokens_in": 3284,
            "tokens_out": 721,
            "latency_ms": 5490,
            "attempt_number": 1,
            "alternatives_rejected": [
                {
                    "draft_summary": "Initial draft hardcoded the OTP resend base URL instead of using the MAGENTO_BASE_URL env var.",
                    "reason_rejected": "Violates RULE-005 (env var only for all base URLs); rejected and regenerated with Guzzle Client base_uri pattern.",
                    "_demo_synthetic": True,
                }
            ],
        },
        "classification": {
            "alternatives_considered": [
                {"level": "unit", "reason_rejected": "Resend.php uses rand() and date() — unit tests cannot assert on OTP value or expiry without injecting a clock and seeding rand, which would require refactoring the production code.", "_demo_synthetic": True},
                {"level": "e2e", "reason_rejected": "OTP resend requires email interception (mailhog/mailtrap) not available in stub environment.", "_demo_synthetic": True},
            ]
        },
        "validation": {
            "ran_against_current": False,
            "ran_against_current_notes": "Stub server does not implement the OTP resend endpoint — test skipped during validation run.",
            "mutation_caught": None,
            "flake_signals": [
                {
                    "type": "non_determinism",
                    "detail": "Resend.php line 56 uses rand(100000, 999999) — any test asserting OTP value will be non-deterministic. Current test avoids this by not asserting OTP content.",
                    "_demo_synthetic": True,
                }
            ],
            "_demo_synthetic": True,
        },
        "steering_signals_applied": ["RULE-001", "RULE-003", "RULE-004"],
    },
}

COMMIT_METADATA = {
    "pr_number": 1,
    "signing_status": "signed",
    "branch": "sentinel/bootstrap-generated-tests",
    "timestamp": "2026-05-05T18:30:00Z",
    "_demo_synthetic": True,
}


# ---------------------------------------------------------------------------
# Loader helpers
# ---------------------------------------------------------------------------

def _load_json(path: Path) -> list | dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _index_by(records: list, key: str) -> dict:
    return {r[key]: r for r in records if key in r}


def _index_by_intent(records: list) -> dict:
    """Index reconciliation records by intent_id."""
    return {r["intent_id"]: r for r in records if "intent_id" in r}


# ---------------------------------------------------------------------------
# Trace assembly
# ---------------------------------------------------------------------------

def _build_trace(gen: dict, intent_map: dict, rec_by_intent: dict,
                 obs_map: dict, eval_map: dict) -> dict:
    gen_id = gen["id"]
    intent_id = gen.get("intent_id", "")
    rec_id = gen.get("rec_id", "")

    intent = intent_map.get(intent_id, {})
    reconciliation = rec_by_intent.get(intent_id, {})
    obs_ids = reconciliation.get("matched_observations", [])
    observations = [obs_map[o] for o in obs_ids if o in obs_map]
    eval_record = eval_map.get(gen_id, {})

    syn = SYNTHETIC.get(gen_id, {})
    syn_gen = syn.get("generation", {})
    syn_cls = syn.get("classification", {})
    syn_val = syn.get("validation", {})
    rule_ids = syn.get("steering_signals_applied", [])

    trace = {
        "test_id": gen_id,
        "source_intents": [intent] if intent else [],
        "source_observations": observations,
        "reconciliation": reconciliation,
        "classification": {
            "level": gen.get("level", "api"),
            "reasoning": gen.get("router_rationale", ""),
            "alternatives_considered": syn_cls.get("alternatives_considered", []),
        },
        "generation": {
            "prompt_template": "prompts/03_generation.md",
            "model": "claude-sonnet-4-6",
            "tokens_in": syn_gen.get("tokens_in"),
            "tokens_out": syn_gen.get("tokens_out"),
            "latency_ms": syn_gen.get("latency_ms"),
            "attempt_number": syn_gen.get("attempt_number", 1),
            "alternatives_rejected": syn_gen.get("alternatives_rejected", []),
            "_synthetic_fields": ["tokens_in", "tokens_out", "latency_ms", "attempt_number", "alternatives_rejected"],
        },
        "eval": {
            "dimensions": eval_record.get("dimensions", []),
            "composite": eval_record.get("composite"),
            "gate_decision": eval_record.get("gate_decision"),
        },
        "validation": syn_val,
        "commit_metadata": COMMIT_METADATA,
        "steering_signals_applied": [STEERING_RULES[r] for r in rule_ids if r in STEERING_RULES],
    }
    return trace


# ---------------------------------------------------------------------------
# UI public/data copy
# ---------------------------------------------------------------------------

def _sync_ui_data() -> None:
    UI_DATA_DIR.mkdir(parents=True, exist_ok=True)
    (UI_DATA_DIR / "traces").mkdir(exist_ok=True)

    # All output JSONs
    output_files = [
        "01_test_intents.json",
        "02_reconciliation.json",
        "03_generation.json",
        "04_eval_scores.json",
        "05_change_impact.json",
        "06_change_summary.json",
        "06_eval_scores.json",
        "test_to_code_map.json",
    ]
    copied = []
    for fname in output_files:
        src = OUTPUTS_DIR / fname
        if src.exists():
            shutil.copy2(src, UI_DATA_DIR / fname)
            copied.append(fname)

    # PR comment (markdown, not JSON — React can fetch it as text)
    pr_comment = OUTPUTS_DIR / "06_pr_comment.md"
    if pr_comment.exists():
        shutil.copy2(pr_comment, UI_DATA_DIR / "06_pr_comment.md")
        copied.append("06_pr_comment.md")

    # Trace files
    trace_files = []
    for tf in sorted(TRACES_DIR.glob("*_trace.json")):
        shutil.copy2(tf, UI_DATA_DIR / "traces" / tf.name)
        trace_files.append(f"traces/{tf.name}")
        copied.append(f"traces/{tf.name}")

    # PHP test files (Bootstrap)
    gen_tests_src = OUTPUTS_DIR / "generated_tests"
    gen_tests_dst = UI_DATA_DIR / "generated_tests"
    if gen_tests_src.exists():
        gen_tests_dst.mkdir(exist_ok=True)
        for php in gen_tests_src.glob("*.php"):
            shutil.copy2(php, gen_tests_dst / php.name)
            copied.append(f"generated_tests/{php.name}")

    # PHP test files (Steady-State)
    updated_src = OUTPUTS_DIR / "06_updated_tests"
    updated_dst = UI_DATA_DIR / "06_updated_tests"
    if updated_src.exists():
        updated_dst.mkdir(exist_ok=True)
        for php in updated_src.glob("*.php"):
            shutil.copy2(php, updated_dst / php.name)
            copied.append(f"06_updated_tests/{php.name}")

    # Write manifest
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "files": copied,
        "traces": trace_files,
    }
    (UI_DATA_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    rprint(f"  -> [green]{UI_DATA_DIR}[/green] ({len(copied)} files)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run() -> list[dict]:
    rprint("\n[bold cyan]Trace Builder - Chapter C[/bold cyan]")

    for path in (
        OUTPUTS_DIR / "01_test_intents.json",
        OUTPUTS_DIR / "02_reconciliation.json",
        OUTPUTS_DIR / "03_generation.json",
        OUTPUTS_DIR / "04_eval_scores.json",
        FIXTURES_DIR / "observed_behavior.json",
    ):
        if not path.exists():
            rprint(f"  [red]Missing:[/red] {path}")
            raise FileNotFoundError(path)

    intents: list[dict] = _load_json(OUTPUTS_DIR / "01_test_intents.json")
    reconciliations: list[dict] = _load_json(OUTPUTS_DIR / "02_reconciliation.json")
    generation: list[dict] = _load_json(OUTPUTS_DIR / "03_generation.json")
    eval_scores: list[dict] = _load_json(OUTPUTS_DIR / "04_eval_scores.json")
    observations: list[dict] = _load_json(FIXTURES_DIR / "observed_behavior.json")

    intent_map = _index_by(intents, "id")
    rec_by_intent = _index_by_intent(reconciliations)
    obs_map = _index_by(observations, "id")
    eval_map = _index_by(eval_scores, "generation_id")

    TRACES_DIR.mkdir(parents=True, exist_ok=True)

    traces = []
    for gen in generation:
        gen_id = gen["id"]
        trace = _build_trace(gen, intent_map, rec_by_intent, obs_map, eval_map)
        out_path = TRACES_DIR / f"{gen_id}_trace.json"
        out_path.write_text(json.dumps(trace, indent=2, ensure_ascii=False), encoding="utf-8")
        gate = trace["eval"].get("gate_decision", "?")
        gate_colors = {"PASS": "green", "WARN": "yellow", "REVIEW": "magenta", "FAIL": "red"}
        color = gate_colors.get(gate, "white")
        obs_count = len(trace["source_observations"])
        steering_count = len(trace["steering_signals_applied"])
        rprint(
            f"  [{color}]{gen_id}[/{color}]  gate={gate}  "
            f"obs={obs_count}  steering_rules={steering_count}  "
            f"-> [dim]{out_path.name}[/dim]"
        )
        traces.append(trace)

    rprint(f"\n  [bold]Traces written:[/bold] [green]{len(traces)}[/green] -> [green]{TRACES_DIR}[/green]")

    # Sync to ui/public/data/
    rprint("  Syncing to ui/public/data/ ...")
    _sync_ui_data()

    return traces


if __name__ == "__main__":
    run()
