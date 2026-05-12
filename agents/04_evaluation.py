"""Stage 4 — Evaluation.

Reads:  data/outputs/03_generation.json          (generated test metadata)
        data/outputs/generated_tests/*.php        (test code)
        data/outputs/02_reconciliation.json       (reconciliation decisions)
        data/inputs/target_code/*.php             (source being tested)
Writes: data/outputs/04_eval_scores.json

Uses claude-sonnet-4-6.
"""

import json
from pathlib import Path

from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from agents._claude import call_claude_json

MODEL = "claude-sonnet-4-6"

BASE_DIR = Path(__file__).parent.parent
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
INPUTS_DIR = BASE_DIR / "data" / "inputs"
PROMPT_FILE = BASE_DIR / "prompts" / "04_evaluation.md"

GENERATION_FILE = OUTPUTS_DIR / "03_generation.json"
RECONCILIATION_FILE = OUTPUTS_DIR / "02_reconciliation.json"
OUTPUT_FILE = OUTPUTS_DIR / "04_eval_scores.json"

WEIGHTS = {
    "syntactic_validity": 0.10,
    "behavior_fidelity":  0.35,
    "coverage_delta":     0.15,
    "assertion_quality":  0.25,
    "determinism":        0.15,
}
DIMENSION_ORDER = list(WEIGHTS.keys())

SCHEMA = {
    "type": "object",
    "properties": {
        "dimensions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name":   {"type": "string"},
                    "score":  {"type": "number"},
                    "weight": {"type": "number"},
                    "notes":  {"type": "string"},
                },
                "required": ["name", "score", "weight", "notes"],
            },
        }
    },
    "required": ["dimensions"],
}

GATE_COLORS = {"PASS": "green", "WARN": "yellow", "REVIEW": "magenta", "FAIL": "red"}


def _gate(composite: float) -> str:
    if composite >= 85:
        return "PASS"
    if composite >= 70:
        return "WARN"
    if composite >= 50:
        return "REVIEW"
    return "FAIL"


def _composite(dimensions: list[dict]) -> float:
    total = 0.0
    for dim in dimensions:
        w = WEIGHTS.get(dim["name"], 0.0)
        total += dim["score"] * w
    return round(total, 2)


def _load_prompt() -> tuple[str, str]:
    text = PROMPT_FILE.read_text(encoding="utf-8")
    parts = text.split("=== USER ===", 1)
    system = parts[0].replace("=== SYSTEM ===", "").strip()
    user_template = parts[1].strip() if len(parts) > 1 else text.strip()
    return system, user_template


def _load_reconciliation_map(path: Path) -> dict[str, dict]:
    records = json.loads(path.read_text(encoding="utf-8"))
    return {r["id"]: r for r in records}


def _load_source_code(source_files: list[str]) -> str:
    parts = []
    for rel_path in source_files:
        full = INPUTS_DIR / rel_path
        if full.exists():
            parts.append(f"// === {full.name} ===\n" + full.read_text(encoding="utf-8"))
        else:
            parts.append(f"// === {rel_path} (not found) ===")
    return "\n\n".join(parts) if parts else "// No source file provided"


def run(
    tests_dir_override: Path | None = None,
    generation_data: list[dict] | None = None,
    output_file_override: Path | None = None,
) -> list[dict]:
    rprint("\n[bold cyan]Stage 4 · Evaluation[/bold cyan]")

    output_file = output_file_override or OUTPUT_FILE

    for path in (GENERATION_FILE, RECONCILIATION_FILE):
        if not path.exists():
            rprint(f"  [red]Missing:[/red] {path}")
            raise FileNotFoundError(path)

    generation: list[dict] = generation_data if generation_data is not None else json.loads(GENERATION_FILE.read_text(encoding="utf-8"))
    rec_map = _load_reconciliation_map(RECONCILIATION_FILE)
    system_prompt, user_template = _load_prompt()

    rprint(f"  → {len(generation)} generated test(s) to evaluate")
    rprint(f"  → Prompt: [dim]{PROMPT_FILE.name}[/dim] | Model: [dim]{MODEL}[/dim]")

    results: list[dict] = []
    errors = 0

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as progress:
        task = progress.add_task("Starting…", total=len(generation))

        for gen in generation:
            gen_id = gen["id"]
            rec_id = gen.get("rec_id", "")
            if tests_dir_override:
                test_file = tests_dir_override / Path(gen.get("file", "")).name
            else:
                test_file = OUTPUTS_DIR / gen.get("file", "")
            progress.update(task, description=f"Evaluating {gen_id}…")

            if not test_file.exists():
                rprint(f"  [red]✗ {gen_id}[/red] — test file not found: {test_file}")
                errors += 1
                progress.advance(task)
                continue

            test_code = test_file.read_text(encoding="utf-8")
            reconciliation = rec_map.get(rec_id, {})
            source_code = _load_source_code(gen.get("source_files", []))

            prompt = (
                user_template
                .replace("{{test_code}}", test_code)
                .replace("{{reconciliation}}", json.dumps(reconciliation, indent=2))
                .replace("{{source_code}}", source_code)
            )

            try:
                raw = call_claude_json(prompt, MODEL, SCHEMA, system=system_prompt)
                dimensions = raw["dimensions"]

                # Enforce canonical weights (don't trust Claude's weight values)
                for dim in dimensions:
                    dim["weight"] = WEIGHTS.get(dim["name"], dim.get("weight", 0.0))

                composite = _composite(dimensions)
                gate = _gate(composite)
                color = GATE_COLORS[gate]

                record = {
                    "id": f"EVAL-{gen_id.replace('GEN-', '')}",
                    "generation_id": gen_id,
                    "dimensions": dimensions,
                    "composite": composite,
                    "gate_decision": gate,
                }
                results.append(record)

                rprint(
                    f"  [{color}]{record['id']}[/{color}]  "
                    f"[{color}]{gate:6s}[/{color}]  "
                    f"composite={composite:5.1f}  "
                    f"[dim]{gen.get('class', '')}[/dim]"
                )
            except Exception as exc:
                errors += 1
                rprint(f"  [red]✗ {gen_id}[/red] — {exc} — skipping")

            progress.advance(task)

    output_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))

    passes  = sum(1 for r in results if r["gate_decision"] == "PASS")
    warns   = sum(1 for r in results if r["gate_decision"] == "WARN")
    reviews = sum(1 for r in results if r["gate_decision"] == "REVIEW")
    fails   = sum(1 for r in results if r["gate_decision"] == "FAIL")

    rprint(
        f"\n  [bold]Done.[/bold] "
        f"[green]{passes} PASS[/green]  [yellow]{warns} WARN[/yellow]  "
        f"[magenta]{reviews} REVIEW[/magenta]  [red]{fails} FAIL  {errors} errors[/red]"
    )
    rprint(f"  → [green]{output_file}[/green]")
    return results


if __name__ == "__main__":
    run()
