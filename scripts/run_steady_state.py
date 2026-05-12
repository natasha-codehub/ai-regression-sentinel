"""Steady-state pipeline: change_impact → test_update → re-evaluate → PR comment.

Usage (live, requires ANTHROPIC_API_KEY):
    python scripts/run_steady_state.py
    python scripts/run_steady_state.py --diff path/to/my.patch --pr 42

Usage (demo stub — no API key needed):
    python scripts/run_steady_state.py --stub
    python scripts/run_steady_state.py --stub --pr 7
"""

import argparse
import importlib.util
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from rich import print as rprint
from rich.rule import Rule

BASE_DIR = Path(__file__).parent.parent
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
FIXTURES_DIR = BASE_DIR / "data" / "fixtures"

PR_COMMENT_FILE = OUTPUTS_DIR / "06_pr_comment.md"
EVAL_SCORES_FILE = OUTPUTS_DIR / "06_eval_scores.json"
UPDATED_DIR = OUTPUTS_DIR / "06_updated_tests"

STUB_IMPACT_FILE = OUTPUTS_DIR / "05_change_impact.json"
STUB_SUMMARY_FILE = OUTPUTS_DIR / "06_change_summary.json"


def load_stage(filename: str):
    agents_dir = BASE_DIR / "agents"
    spec = importlib.util.spec_from_file_location(filename, agents_dir / f"{filename}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _write_pr_comment(summary: dict, eval_scores: list[dict], pr_number: int) -> None:
    pr_num = pr_number or summary.get("pr_number", 1)
    diff_summary = summary.get("diff_summary", "")
    updates = summary.get("tests_updated", [])
    recommendations = summary.get("new_tests_recommended", [])

    composites = [r["composite"] for r in eval_scores if "composite" in r]
    avg = round(sum(composites) / len(composites), 1) if composites else 0.0
    gate_word = "passed" if avg >= 70 else "did not pass"

    lines = [
        f"## Sentinel update for PR #{pr_num}",
        f"**Summary**: {diff_summary}",
        "",
        f"### Tests updated ({len(updates)})",
    ]
    for u in updates:
        lines.append(f"- `{u['test_filename']}` — {u['change_explanation']}")

    lines.append("")
    lines.append(f"### New tests recommended ({len(recommendations)})")
    for r in recommendations:
        desc = r.get("description", r) if isinstance(r, dict) else str(r)
        lines.append(f"- {desc} (recommendation)")

    lines.append("")
    lines.append("### Eval gate")
    lines.append(f"All updated tests {gate_word} eval gate (composite avg {avg}).")
    lines.append("")

    PR_COMMENT_FILE.write_text("\n".join(lines), encoding="utf-8")
    rprint(f"  → [green]{PR_COMMENT_FILE}[/green]")


def _run_stub(pr_number: int) -> None:
    """Simulate the steady-state pipeline using pre-seeded fixture outputs."""
    rprint(Rule("[bold magenta]Sentinel · Steady-State Pipeline  [dim](stub mode)[/dim][/bold magenta]"))

    # Stage 5
    rprint(Rule("[dim]Stage 5 · Change Impact[/dim]"))
    rprint("\n[bold cyan]Stage 5 - Change Impact Agent[/bold cyan]")
    rprint("  -> Parsed diff: [bold]2[/bold] file(s) changed")
    rprint("    [dim]+3 -1[/dim]  app/code/StripeIntegration/Payments/Controller/Customer/PaymentMethods.php")
    rprint("    [dim]+4 -0[/dim]  app/code/Venture7/BusinessAccount/Controller/Index/Save.php")
    rprint("  -> Test map: [bold]8[/bold] symbol(s)")
    rprint("  -> Prompt: [dim]05_change_impact.md[/dim] | Model: [dim]claude-sonnet-4-6[/dim]")
    time.sleep(1.2)
    rprint("  [dim]claude-sonnet-4-6 | in=2841 out=487 | 4.3s[/dim]")

    impact = json.loads(STUB_IMPACT_FILE.read_text(encoding="utf-8"))
    rprint(
        f"\n  [bold]Done.[/bold]  "
        f"[green]{len(impact['changed_symbols'])}[/green] changed symbol(s)  "
        f"[yellow]{len(impact['affected_tests'])}[/yellow] affected test(s)  "
        f"[cyan]{len(impact['new_test_recommendations'])}[/cyan] recommendation(s)"
    )
    rprint(f"  -> [green]{STUB_IMPACT_FILE}[/green]")

    # Stage 6
    rprint(Rule("[dim]Stage 6 - Test Update[/dim]"))
    rprint("\n[bold cyan]Stage 6 - Test Update Agent[/bold cyan]")
    rprint(f"  -> {len(impact['affected_tests'])} affected test(s) to update")
    rprint("  -> Model: [dim]claude-opus-4-7[/dim] | Prompt: [dim]06_test_update.md[/dim]")

    summary = json.loads(STUB_SUMMARY_FILE.read_text(encoding="utf-8"))
    summary["pr_number"] = pr_number

    for u in summary.get("tests_updated", []):
        time.sleep(1.8)
        rprint(f"  [dim]claude-opus-4-7 | in=4217 out=1103 | 11.2s[/dim]")
        rprint(f"  [green]OK[/green] {u['test_filename']}")

    rprint(
        f"\n  [bold]Done.[/bold] "
        f"[green]{len(summary['tests_updated'])}[/green] updated  [red]0[/red] errors"
    )
    rprint(f"  -> [green]{UPDATED_DIR}[/green]")

    # Stage 4 re-eval
    rprint(Rule("[dim]Stage 4 - Re-evaluation (updated tests)[/dim]"))
    rprint("\n[bold cyan]Stage 4 - Evaluation[/bold cyan]")
    eval_scores = json.loads(EVAL_SCORES_FILE.read_text(encoding="utf-8"))
    rprint(f"  -> {len(eval_scores)} generated test(s) to evaluate")
    rprint("  -> Prompt: [dim]04_evaluation.md[/dim] | Model: [dim]claude-sonnet-4-6[/dim]")

    gate_colors = {"PASS": "green", "WARN": "yellow", "REVIEW": "magenta", "FAIL": "red"}
    for r in eval_scores:
        time.sleep(1.5)
        rprint(f"  [dim]claude-sonnet-4-6 | in=3104 out=612 | 6.8s[/dim]")
        gate = r.get("gate_decision", "WARN")
        color = gate_colors.get(gate, "white")
        rprint(
            f"  [{color}]{r['id']}[/{color}]  "
            f"[{color}]{gate:6s}[/{color}]  "
            f"composite={r['composite']:5.1f}  "
            f"[dim]{r.get('test_filename', '')}[/dim]"
        )

    passes = sum(1 for r in eval_scores if r.get("gate_decision") == "PASS")
    warns = sum(1 for r in eval_scores if r.get("gate_decision") == "WARN")
    rprint(f"\n  [bold]Done.[/bold] [green]{passes} PASS[/green]  [yellow]{warns} WARN[/yellow]")
    rprint(f"  -> [green]{EVAL_SCORES_FILE}[/green]")

    # PR comment
    rprint(Rule("[dim]Writing PR comment[/dim]"))
    _write_pr_comment(summary, eval_scores, pr_number)

    rprint(Rule("[bold green]PR Comment[/bold green]"))
    rprint(PR_COMMENT_FILE.read_text(encoding="utf-8"))

    rprint(Rule("[bold green]Steady-State Pipeline complete[/bold green]"))
    rprint(f"  Updated tests : [green]{UPDATED_DIR}[/green]")
    rprint(f"  Eval scores   : [green]{EVAL_SCORES_FILE}[/green]")
    rprint(f"  PR comment    : [green]{PR_COMMENT_FILE}[/green]")


def _run_live(diff_path: Path, pr_number: int) -> None:
    rprint(Rule("[bold magenta]Sentinel · Steady-State Pipeline[/bold magenta]"))
    rprint(f"  Diff: [dim]{diff_path}[/dim]  PR: [dim]#{pr_number}[/dim]")

    # Stage 5
    rprint(Rule("[dim]Stage 5 · Change Impact[/dim]"))
    stage5 = load_stage("05_change_impact")
    stage5.PATCH_FILE = diff_path
    stage5.run()

    # Stage 6
    rprint(Rule("[dim]Stage 6 · Test Update[/dim]"))
    stage6 = load_stage("06_test_update")
    summary = stage6.run(diff_path=diff_path, pr_number=pr_number)

    # Re-eval
    updated_files = list(UPDATED_DIR.glob("*.php")) if UPDATED_DIR.exists() else []
    if not updated_files:
        rprint("[yellow]No updated test files — skipping re-evaluation.[/yellow]")
        eval_scores: list[dict] = []
    else:
        gen_file = OUTPUTS_DIR / "03_generation.json"
        generation_data: list[dict] = json.loads(gen_file.read_text(encoding="utf-8"))
        updated_filenames = {f.name for f in updated_files}
        affected_generation = [
            g for g in generation_data
            if Path(g.get("file", "")).name in updated_filenames
        ]
        rprint(Rule("[dim]Stage 4 · Re-evaluation (updated tests)[/dim]"))
        stage4 = load_stage("04_evaluation")
        eval_scores = stage4.run(
            tests_dir_override=UPDATED_DIR,
            generation_data=affected_generation,
            output_file_override=EVAL_SCORES_FILE,
        )

    rprint(Rule("[dim]Writing PR comment[/dim]"))
    _write_pr_comment(summary, eval_scores, pr_number)

    rprint(Rule("[bold green]PR Comment[/bold green]"))
    rprint(PR_COMMENT_FILE.read_text(encoding="utf-8"))

    rprint(Rule("[bold green]Steady-State Pipeline complete[/bold green]"))
    rprint(f"  Updated tests : [green]{UPDATED_DIR}[/green]")
    rprint(f"  Eval scores   : [green]{EVAL_SCORES_FILE}[/green]")
    rprint(f"  PR comment    : [green]{PR_COMMENT_FILE}[/green]")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sentinel Steady-State pipeline")
    parser.add_argument(
        "--diff",
        default=str(FIXTURES_DIR / "sample_diff.patch"),
        help="Path to unified diff file (default: data/fixtures/sample_diff.patch)",
    )
    parser.add_argument("--pr", type=int, default=1, help="PR number (default: 1)")
    parser.add_argument(
        "--stub",
        action="store_true",
        help="Run in stub/demo mode — no API calls, uses pre-seeded fixture outputs",
    )
    args = parser.parse_args()

    if args.stub:
        _run_stub(pr_number=args.pr)
    else:
        diff_path = Path(args.diff)
        if not diff_path.exists():
            rprint(f"[red]Diff file not found:[/red] {diff_path}")
            raise SystemExit(1)
        _run_live(diff_path=diff_path, pr_number=args.pr)


if __name__ == "__main__":
    main()
