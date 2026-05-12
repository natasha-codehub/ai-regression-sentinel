"""Stage 5 -- Change Impact Agent.

Reads:  data/fixtures/sample_diff.patch      (unified diff of the code change)
        data/outputs/test_to_code_map.json   (symbol -> test-id map from build script)
        prompts/05_change_impact.md
Writes: data/outputs/05_change_impact.json

Uses claude-sonnet-4-6.
"""

import json
from pathlib import Path

import unidiff
from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from agents._claude import call_claude_json

MODEL = "claude-sonnet-4-6"

BASE_DIR = Path(__file__).parent.parent
FIXTURES_DIR = BASE_DIR / "data" / "fixtures"
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
PROMPT_FILE = BASE_DIR / "prompts" / "05_change_impact.md"

PATCH_FILE = FIXTURES_DIR / "sample_diff.patch"
MAP_FILE = OUTPUTS_DIR / "test_to_code_map.json"
OUTPUT_FILE = OUTPUTS_DIR / "05_change_impact.json"

SCHEMA = {
    "type": "object",
    "properties": {
        "diff_summary": {"type": "string"},
        "changed_symbols": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string"},
                    "name": {"type": "string"},
                    "file": {"type": "string"},
                },
                "required": ["type", "name", "file"],
            },
        },
        "affected_tests": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "test_id": {"type": "string"},
                    "test_filename": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["test_id", "test_filename", "reason"],
            },
        },
        "new_test_recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["description", "reason"],
            },
        },
    },
    "required": [
        "diff_summary",
        "changed_symbols",
        "affected_tests",
        "new_test_recommendations",
    ],
}


def _parse_diff_summary(patch_text: str) -> list[dict]:
    """Parse unified diff using unidiff; return per-file change summaries."""
    patch_set = unidiff.PatchSet(patch_text)
    files = []
    for patched_file in patch_set:
        added = sum(1 for h in patched_file for ln in h if ln.is_added)
        removed = sum(1 for h in patched_file for ln in h if ln.is_removed)
        hunks = []
        for hunk in patched_file:
            section = (hunk.section_header or "").strip()
            added_lines = [ln.value.rstrip("\n") for ln in hunk if ln.is_added]
            removed_lines = [ln.value.rstrip("\n") for ln in hunk if ln.is_removed]
            hunks.append(
                {
                    "function_context": section,
                    "added_lines": added_lines,
                    "removed_lines": removed_lines,
                }
            )
        files.append(
            {
                "file": patched_file.path,
                "additions": added,
                "deletions": removed,
                "hunks": hunks,
            }
        )
    return files


def _load_prompt() -> tuple[str, str]:
    text = PROMPT_FILE.read_text(encoding="utf-8")
    parts = text.split("=== USER ===", 1)
    system = parts[0].replace("=== SYSTEM ===", "").strip()
    user_template = parts[1].strip() if len(parts) > 1 else text.strip()
    return system, user_template


def run() -> dict:
    rprint("\n[bold cyan]Stage 5 - Change Impact Agent[/bold cyan]")

    for path in (PATCH_FILE, MAP_FILE):
        if not path.exists():
            rprint(f"  [red]Missing:[/red] {path}")
            raise FileNotFoundError(path)

    patch_text = PATCH_FILE.read_text(encoding="utf-8")
    test_map: dict = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    system_prompt, user_template = _load_prompt()

    changed_files = _parse_diff_summary(patch_text)
    rprint(f"  -> Parsed diff: [bold]{len(changed_files)}[/bold] file(s) changed")
    for f in changed_files:
        rprint(
            f"    [dim]+{f['additions']} -{f['deletions']}[/dim]  {f['file']}"
        )

    rprint(f"  -> Test map: [bold]{len(test_map)}[/bold] symbol(s)")
    rprint(f"  -> Prompt: [dim]{PROMPT_FILE.name}[/dim] | Model: [dim]{MODEL}[/dim]")

    prompt = (
        user_template
        .replace("{{diff_text}}", patch_text)
        .replace("{{test_map}}", json.dumps(test_map, indent=2))
    )

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as p:
        p.add_task("Calling Claude...", total=None)
        result = call_claude_json(prompt, MODEL, SCHEMA, system=system_prompt)

    OUTPUT_FILE.write_text(json.dumps(result, indent=2, ensure_ascii=False))

    rprint(f"\n  [bold]Done.[/bold]")
    rprint(
        f"  -> [green]{len(result.get('changed_symbols', []))}[/green] changed symbol(s)  "
        f"[yellow]{len(result.get('affected_tests', []))}[/yellow] affected test(s)  "
        f"[cyan]{len(result.get('new_test_recommendations', []))}[/cyan] recommendation(s)"
    )
    rprint(f"  -> [green]{OUTPUT_FILE}[/green]")
    return result


if __name__ == "__main__":
    run()
