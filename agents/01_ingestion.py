"""Stage 1 — Test Intent Ingestion.

Reads:  data/inputs/regression_suite.xlsx
Writes: data/outputs/01_test_intents.json
"""

import json
import re
from pathlib import Path

import openpyxl
from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from agents._claude import call_claude_json

MODEL = "claude-sonnet-4-6"

BASE_DIR = Path(__file__).parent.parent
INPUTS_DIR = BASE_DIR / "data" / "inputs"
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
PROMPT_FILE = BASE_DIR / "prompts" / "01_ingestion.md"

XLSX_PATH = INPUTS_DIR / "regression_suite.xlsx"
OUTPUT_FILE = OUTPUTS_DIR / "01_test_intents.json"

# Column indices (0-based) — matches the known XLSX layout:
# A=Test Case ID, B=Module Name, C=Testing Type, D=Description, E=Pre-conditions, F=Steps
COL_ID = 0
COL_MODULE = 1
COL_TYPE = 2
COL_DESC = 3
COL_PRE = 4
COL_STEPS = 5

SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "source_row": {"type": "integer"},
        "feature_area": {"type": "string"},
        "action_description": {"type": "string"},
        "expected_behavior": {"type": "string"},
        "preconditions": {"type": "array", "items": {"type": "string"}},
        "test_data_hints": {"type": "array", "items": {"type": "string"}},
        "original_text": {"type": "string"},
    },
    "required": [
        "id", "source_row", "feature_area", "action_description",
        "expected_behavior", "preconditions", "test_data_hints", "original_text",
    ],
}


def _load_prompt() -> tuple[str, str]:
    """Split prompt file on === USER === marker → (system, user_template)."""
    text = PROMPT_FILE.read_text(encoding="utf-8")
    parts = text.split("=== USER ===", 1)
    system = parts[0].replace("=== SYSTEM ===", "").strip()
    user_template = parts[1].strip() if len(parts) > 1 else text.strip()
    return system, user_template


def _cell(row: tuple, col: int) -> str:
    val = row[col].value
    return str(val).strip() if val is not None else ""


def _ti_id(cf_id: str, fallback: int) -> str:
    """CF-03 → TI-003; falls back to TI-{fallback:03d} for unexpected formats."""
    m = re.search(r"\d+", cf_id)
    n = int(m.group()) if m else fallback
    return f"TI-{n:03d}"


def _build_row_text(row: tuple, ti_id: str, row_num: int) -> tuple[str, str]:
    """Return (claude_input_text, original_text) for a single XLSX row."""
    cf_id = _cell(row, COL_ID)
    module = _cell(row, COL_MODULE)
    type_ = _cell(row, COL_TYPE)
    desc = _cell(row, COL_DESC)
    pre = _cell(row, COL_PRE)
    steps = _cell(row, COL_STEPS)

    claude_input = (
        f"ID: {ti_id} | SOURCE_ROW: {row_num}\n"
        f"MODULE: {module}\n"
        f"TYPE: {type_}\n"
        f"DESCRIPTION: {desc}\n"
        f"PRECONDITIONS: {pre}\n"
        f"STEPS: {steps}"
    )
    original = " | ".join(filter(None, [cf_id, module, type_, desc, pre, steps]))
    return claude_input, original


def run() -> list[dict]:
    rprint("\n[bold cyan]Stage 1 · Test Intent Ingestion[/bold cyan]")

    if not XLSX_PATH.exists():
        rprint(f"  [red]Missing:[/red] {XLSX_PATH}")
        raise FileNotFoundError(XLSX_PATH)

    system_prompt, user_template = _load_prompt()
    rprint(f"  → Prompt loaded from [dim]{PROMPT_FILE.name}[/dim]")

    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    sheet = wb.active
    all_rows = list(sheet.iter_rows())
    data_rows = all_rows[1:]  # skip header row
    rprint(f"  → {len(data_rows)} data rows found (header excluded)")

    OUTPUTS_DIR.mkdir(exist_ok=True)
    results: list[dict] = []
    skipped = 0
    errors = 0

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as progress:
        task = progress.add_task("Starting…", total=len(data_rows))

        for i, row in enumerate(data_rows, start=1):
            row_num = i + 1  # 1-based Excel row, offset by header
            cf_id = _cell(row, COL_ID)
            desc = _cell(row, COL_DESC)

            if not cf_id or not desc:
                skipped += 1
                progress.advance(task)
                continue

            ti_id = _ti_id(cf_id, i)
            progress.update(task, description=f"Processing {cf_id} → {ti_id}")

            row_text, original_text = _build_row_text(row, ti_id, row_num)
            prompt = user_template.replace("{{row_text}}", row_text)

            try:
                result = call_claude_json(prompt, MODEL, SCHEMA, system=system_prompt)
                # Enforce authoritative values — don't trust Claude to count rows correctly
                result["id"] = ti_id
                result["source_row"] = row_num
                result["original_text"] = original_text
                results.append(result)
                rprint(
                    f"  [green]✓[/green] {ti_id}  "
                    f"[dim]{result.get('feature_area', '?'):18s}[/dim]  "
                    f"{result.get('action_description', '')[:70]}…"
                )
            except Exception as exc:
                errors += 1
                rprint(f"  [red]✗[/red] {cf_id} — {exc} — skipping")

            progress.advance(task)

    wb.close()

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    rprint(
        f"\n  [bold]Done.[/bold] "
        f"[green]{len(results)}[/green] intents written → [green]{OUTPUT_FILE}[/green]  "
        f"([yellow]{skipped}[/yellow] empty rows skipped, [red]{errors}[/red] errors)"
    )
    return results


if __name__ == "__main__":
    run()
