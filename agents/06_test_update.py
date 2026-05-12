"""Stage 6 -- Test Update Agent.

Reads:  data/outputs/05_change_impact.json
        data/outputs/generated_tests/<affected>.php   (original test code)
        data/outputs/03_generation.json               (source_file mapping)
        data/inputs/target_code/<source>.php          (post-diff source)
        data/fixtures/sample_diff.patch               (the diff, or override)
        prompts/06_test_update.md
Writes: data/outputs/06_updated_tests/<test>.php      (one per affected test)
        data/outputs/06_change_summary.json           (structured update log)

Uses claude-opus-4-7.
"""

import json
from pathlib import Path

from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from agents._claude import call_claude

MODEL = "claude-opus-4-7"

BASE_DIR = Path(__file__).parent.parent
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
INPUTS_DIR = BASE_DIR / "data" / "inputs"
FIXTURES_DIR = BASE_DIR / "data" / "fixtures"
PROMPT_FILE = BASE_DIR / "prompts" / "06_test_update.md"

IMPACT_FILE = OUTPUTS_DIR / "05_change_impact.json"
GENERATION_FILE = OUTPUTS_DIR / "03_generation.json"
TESTS_DIR = OUTPUTS_DIR / "generated_tests"
UPDATED_DIR = OUTPUTS_DIR / "06_updated_tests"
SUMMARY_FILE = OUTPUTS_DIR / "06_change_summary.json"


def _load_prompt() -> tuple[str, str]:
    text = PROMPT_FILE.read_text(encoding="utf-8")
    parts = text.split("=== USER ===", 1)
    system = parts[0].replace("=== SYSTEM ===", "").strip()
    user_template = parts[1].strip() if len(parts) > 1 else text.strip()
    return system, user_template


def _build_gen_map(generation: list[dict]) -> dict[str, dict]:
    """Map test filename → generation record."""
    return {Path(g["file"]).name: g for g in generation}


def _load_source_files(source_files: list[str]) -> str:
    parts = []
    for rel in source_files:
        full = INPUTS_DIR / rel
        if full.exists():
            parts.append(f"// === {full.name} ===\n" + full.read_text(encoding="utf-8"))
        else:
            parts.append(f"// === {rel} (not found) ===")
    return "\n\n".join(parts) if parts else "// No source file provided"


def _strip_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = "\n".join(cleaned.split("\n")[1:])
    if cleaned.endswith("```"):
        cleaned = "\n".join(cleaned.split("\n")[:-1])
    return cleaned.strip()


def run(diff_path: Path | None = None, pr_number: int = 1) -> dict:
    rprint("\n[bold cyan]Stage 6 · Test Update Agent[/bold cyan]")

    patch_file = diff_path or (FIXTURES_DIR / "sample_diff.patch")

    for path in (IMPACT_FILE, GENERATION_FILE, patch_file):
        if not path.exists():
            rprint(f"  [red]Missing:[/red] {path}")
            raise FileNotFoundError(path)

    impact: dict = json.loads(IMPACT_FILE.read_text(encoding="utf-8"))
    generation: list[dict] = json.loads(GENERATION_FILE.read_text(encoding="utf-8"))
    diff_text = patch_file.read_text(encoding="utf-8")
    system_prompt, user_template = _load_prompt()
    gen_map = _build_gen_map(generation)

    affected_tests = impact.get("affected_tests", [])
    recommendations = impact.get("new_test_recommendations", [])
    diff_summary = impact.get("diff_summary", "")

    UPDATED_DIR.mkdir(parents=True, exist_ok=True)

    rprint(f"  → {len(affected_tests)} affected test(s) to update")
    rprint(f"  → Model: [dim]{MODEL}[/dim] | Prompt: [dim]{PROMPT_FILE.name}[/dim]")

    updates: list[dict] = []
    errors = 0

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as progress:
        task = progress.add_task("Starting…", total=len(affected_tests))

        for affected in affected_tests:
            test_filename = affected.get("test_filename", "")
            reason = affected.get("reason", "")
            test_id = affected.get("test_id", "")

            progress.update(task, description=f"Updating {test_filename}…")

            if not test_filename:
                rprint(f"  [yellow]⚠ Skipping {test_id}[/yellow] — no test_filename in impact output")
                errors += 1
                progress.advance(task)
                continue

            orig_path = TESTS_DIR / test_filename
            if not orig_path.exists():
                rprint(f"  [yellow]⚠ Skipping {test_filename}[/yellow] — not found in generated_tests/")
                errors += 1
                progress.advance(task)
                continue

            original_test = orig_path.read_text(encoding="utf-8")
            gen_record = gen_map.get(test_filename, {})
            source_code = _load_source_files(gen_record.get("source_files", []))

            prompt = (
                user_template
                .replace("{{original_test}}", original_test)
                .replace("{{change_reason}}", reason)
                .replace("{{diff_excerpt}}", diff_text)
                .replace("{{new_source_code}}", source_code)
            )

            try:
                raw = call_claude(prompt, MODEL, system=system_prompt)
                updated_code = _strip_fences(raw)

                out_path = UPDATED_DIR / test_filename
                out_path.write_text(updated_code, encoding="utf-8")

                updates.append({
                    "test_id": test_id,
                    "test_filename": test_filename,
                    "change_explanation": reason,
                    "output_path": str(out_path),
                })
                rprint(f"  [green]✓[/green] {test_filename}")
            except Exception as exc:
                errors += 1
                rprint(f"  [red]✗ {test_filename}[/red] — {exc}")

            progress.advance(task)

    summary = {
        "pr_number": pr_number,
        "diff_summary": diff_summary,
        "tests_updated": updates,
        "new_tests_recommended": [
            {"description": r["description"]} for r in recommendations
        ],
        "eval_composite_avg": None,  # populated by run_steady_state.py after re-eval
    }
    SUMMARY_FILE.write_text(json.dumps(summary, indent=2, ensure_ascii=False))

    rprint(
        f"\n  [bold]Done.[/bold] "
        f"[green]{len(updates)}[/green] updated  [red]{errors}[/red] errors"
    )
    rprint(f"  → [green]{UPDATED_DIR}[/green]")
    rprint(f"  → [green]{SUMMARY_FILE}[/green]")
    return summary


if __name__ == "__main__":
    run()
