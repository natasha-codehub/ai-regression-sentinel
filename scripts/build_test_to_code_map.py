"""Build test_to_code_map.json from 03_generation.json + target source files.

Reads:  data/outputs/03_generation.json   (generated test metadata)
        data/inputs/target_code/*.php     (PHP source files referenced by tests)
Writes: data/outputs/test_to_code_map.json

Map structure:
  { "ClassName::methodName": ["GEN-001", "GEN-003"], ... }
"""

import json
import re
from pathlib import Path

from rich import print as rprint

BASE_DIR = Path(__file__).parent.parent
INPUTS_DIR = BASE_DIR / "data" / "inputs"
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
GENERATION_FILE = OUTPUTS_DIR / "03_generation.json"
OUTPUT_FILE = OUTPUTS_DIR / "test_to_code_map.json"


def extract_symbols(php_path: Path) -> list[str]:
    """Return ClassName::methodName pairs from a PHP file via regex."""
    text = php_path.read_text(encoding="utf-8")
    classes = re.findall(r"\bclass\s+(\w+)", text)
    methods = re.findall(
        r"(?:public|protected|private)\s+(?:static\s+)?function\s+(\w+)", text
    )
    class_name = classes[0] if classes else php_path.stem
    return [f"{class_name}::{method}" for method in methods]


def run() -> dict:
    rprint("\n[bold cyan]build_test_to_code_map - Stage 3 metadata to symbol map[/bold cyan]")

    if not GENERATION_FILE.exists():
        rprint(f"  [red]Missing:[/red] {GENERATION_FILE} — run stage 3 first")
        raise FileNotFoundError(GENERATION_FILE)

    generation: list[dict] = json.loads(GENERATION_FILE.read_text(encoding="utf-8"))
    rprint(f"  -> {len(generation)} generated test(s) in {GENERATION_FILE.name}")

    code_map: dict[str, list[str]] = {}
    missing = 0

    for test in generation:
        test_id = test["id"]
        source_files = test.get("source_files", [])

        if not source_files:
            rprint(f"  [dim]  {test_id}: no source_files — skipped[/dim]")
            continue

        for rel_path in source_files:
            php_path = INPUTS_DIR / rel_path
            if not php_path.exists():
                rprint(f"  [yellow]  {test_id}: {rel_path} not found — skipped[/yellow]")
                missing += 1
                continue

            symbols = extract_symbols(php_path)
            for symbol in symbols:
                code_map.setdefault(symbol, [])
                if test_id not in code_map[symbol]:
                    code_map[symbol].append(test_id)

            rprint(
                f"  [green]{test_id}[/green] <- {php_path.name}"
                f" ({len(symbols)} symbol(s))"
            )

    OUTPUT_FILE.write_text(json.dumps(code_map, indent=2, ensure_ascii=False))

    rprint(f"\n  [bold]Done.[/bold] {len(code_map)} symbol(s) mapped, {missing} source(s) missing")
    rprint(f"  -> [green]{OUTPUT_FILE}[/green]")
    return code_map


if __name__ == "__main__":
    run()
