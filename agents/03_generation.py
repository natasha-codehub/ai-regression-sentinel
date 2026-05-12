"""Stage 3 — Test Pyramid Router + Test Generation.

Reads:  data/outputs/02_reconciliation.json  (unified behavior manifest)
        prompts/03_generation.md
Writes: data/outputs/03_generation.json      (metadata + eval scores)
        data/outputs/generated_tests/        (one .php file per test)
"""

import json
from pathlib import Path

from rich import print as rprint

OUTPUTS_DIR = Path(__file__).parent.parent / "data" / "outputs"
TESTS_DIR = OUTPUTS_DIR / "generated_tests"
INPUT_FILE = OUTPUTS_DIR / "02_reconciliation.json"
OUTPUT_FILE = OUTPUTS_DIR / "03_generation.json"


def run() -> dict:
    rprint("\n[bold cyan]Stage 3 · Test Pyramid Router + Test Generation[/bold cyan]")

    if not INPUT_FILE.exists():
        rprint(f"  [red]Missing input:[/red] {INPUT_FILE} — run stage 2 first")
        raise FileNotFoundError(INPUT_FILE)

    reconciliation = json.loads(INPUT_FILE.read_text())
    rprint(f"  → Read {len(reconciliation.get('behaviors', []))} behavior(s) from stage 2")
    rprint("  → Would call Claude (sonnet-4-6) to classify each behavior → test level")
    rprint("     (unit | api | contract | integration | e2e)")
    rprint("  → For demo scope: all routed to [yellow]api[/yellow] (PHPUnit + Guzzle)")
    rprint("  → Would call Claude (sonnet-4-6) with prompts/03_generation.md to write tests")

    TESTS_DIR.mkdir(exist_ok=True)

    placeholder_php = (
        "<?php\n"
        "// PLACEHOLDER — Stage 3 will generate real PHPUnit + Guzzle tests here\n"
        "class CheckoutTest extends TestCase {\n"
        "    public function testCheckoutSucceedsWithValidCart(): void {\n"
        "        $this->markTestIncomplete('Not yet generated');\n"
        "    }\n"
        "}\n"
    )
    test_file = TESTS_DIR / "CheckoutTest.php"
    test_file.write_text(placeholder_php)
    rprint(f"  → Wrote placeholder test: [green]{test_file}[/green]")

    placeholder = {
        "stage": "03_generation",
        "status": "placeholder",
        "generated_tests": [
            {
                "id": "TEST-001",
                "behavior_id": "BEH-001",
                "level": "api",
                "file": "generated_tests/CheckoutTest.php",
                "class": "CheckoutTest",
                "method": "testCheckoutSucceedsWithValidCart",
                "router_rationale": "placeholder",
            }
        ],
    }

    OUTPUT_FILE.write_text(json.dumps(placeholder, indent=2))
    rprint(f"  ✓ Wrote [green]{OUTPUT_FILE}[/green]")
    return placeholder


if __name__ == "__main__":
    run()
