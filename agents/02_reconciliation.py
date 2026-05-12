"""Stage 2 — Reconciliation.

Reads:  data/outputs/01_test_intents.json       (structured test intents from stage 1)
        data/fixtures/observed_behavior.json    (curated API request/response pairs)
Writes: data/outputs/02_reconciliation.json     (array of REC-XXX decisions)

Uses claude-opus-4-7 — reconciliation reasoning is harder.
"""

import json
from pathlib import Path

from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from agents._claude import call_claude_json

MODEL = "claude-opus-4-7"

BASE_DIR = Path(__file__).parent.parent
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
FIXTURES_DIR = BASE_DIR / "data" / "fixtures"
PROMPT_FILE = BASE_DIR / "prompts" / "02_reconciliation.md"

INTENTS_FILE = OUTPUTS_DIR / "01_test_intents.json"
OBSERVED_FILE = FIXTURES_DIR / "observed_behavior.json"
OUTPUT_FILE = OUTPUTS_DIR / "02_reconciliation.json"

SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "intent_id": {"type": "string"},
        "matched_observations": {"type": "array", "items": {"type": "string"}},
        "decision": {
            "type": "string",
            "enum": ["agree", "spec_outdated", "behavior_regressed", "no_observation", "human_review"],
        },
        "confidence": {"type": "number"},
        "reasoning": {"type": "string"},
        "final_expected_behavior": {"type": "string"},
    },
    "required": ["id", "intent_id", "matched_observations", "decision", "confidence", "reasoning", "final_expected_behavior"],
}

DECISION_COLORS = {
    "agree": "green",
    "spec_outdated": "yellow",
    "behavior_regressed": "red",
    "no_observation": "dim",
    "human_review": "magenta",
}


def _load_prompt() -> tuple[str, str]:
    text = PROMPT_FILE.read_text(encoding="utf-8")
    parts = text.split("=== USER ===", 1)
    system = parts[0].replace("=== SYSTEM ===", "").strip()
    user_template = parts[1].strip() if len(parts) > 1 else text.strip()
    return system, user_template


def _rec_id(intent_id: str) -> str:
    """TI-009 → REC-009"""
    return intent_id.replace("TI-", "REC-")


def run() -> list[dict]:
    rprint("\n[bold cyan]Stage 2 · Reconciliation[/bold cyan]")

    for path in (INTENTS_FILE, OBSERVED_FILE):
        if not path.exists():
            rprint(f"  [red]Missing:[/red] {path}")
            raise FileNotFoundError(path)

    intents: list[dict] = json.loads(INTENTS_FILE.read_text(encoding="utf-8"))
    observations: list[dict] = json.loads(OBSERVED_FILE.read_text(encoding="utf-8"))
    observations_json = json.dumps(observations, indent=2)

    rprint(f"  → {len(intents)} test intents loaded")
    rprint(f"  → {len(observations)} observed API calls loaded")
    rprint(f"  → Prompt: [dim]{PROMPT_FILE.name}[/dim] | Model: [dim]{MODEL}[/dim]")

    system_prompt, user_template = _load_prompt()

    OUTPUTS_DIR.mkdir(exist_ok=True)
    results: list[dict] = []
    errors = 0

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as progress:
        task = progress.add_task("Starting…", total=len(intents))

        for intent in intents:
            intent_id = intent["id"]
            progress.update(task, description=f"Reconciling {intent_id}…")

            prompt = (
                user_template
                .replace("{{intent}}", json.dumps(intent, indent=2))
                .replace("{{observations}}", observations_json)
            )

            try:
                result = call_claude_json(prompt, MODEL, SCHEMA, system=system_prompt)
                # Enforce our own id derivation
                result["id"] = _rec_id(intent_id)
                result["intent_id"] = intent_id
                results.append(result)

                decision = result.get("decision", "?")
                color = DECISION_COLORS.get(decision, "white")
                rprint(
                    f"  [{color}]{result['id']}[/{color}]  "
                    f"[{color}]{decision:20s}[/{color}]  "
                    f"conf={result.get('confidence', 0):.2f}  "
                    f"[dim]{result.get('reasoning', '')[:60]}…[/dim]"
                )
            except Exception as exc:
                errors += 1
                rprint(f"  [red]✗ {intent_id}[/red] — {exc} — skipping")

            progress.advance(task)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))

    conflicts = [r for r in results if r.get("decision") in ("behavior_regressed", "spec_outdated")]
    rprint(
        f"\n  [bold]Done.[/bold] "
        f"[green]{len(results)}[/green] reconciled → [green]{OUTPUT_FILE}[/green]  "
        f"[red]{len(conflicts)} conflict(s)[/red]  [red]{errors} error(s)[/red]"
    )
    return results


if __name__ == "__main__":
    run()
