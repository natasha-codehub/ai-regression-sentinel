"""Bootstrap pipeline orchestrator — runs all four stages then builds traces."""

import importlib
import importlib.util
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from rich import print as rprint
from rich.rule import Rule


def load_stage(filename: str):
    """Load an agent module whose name starts with a digit (e.g. '01_ingestion')."""
    agents_dir = Path(__file__).parent.parent / "agents"
    spec = importlib.util.spec_from_file_location(filename, agents_dir / f"{filename}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_script(filename: str):
    """Load a script module from the scripts/ directory."""
    scripts_dir = Path(__file__).parent
    spec = importlib.util.spec_from_file_location(filename, scripts_dir / f"{filename}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    rprint(Rule("[bold magenta]Sentinel - Bootstrap Pipeline[/bold magenta]"))

    stages = [
        "01_ingestion",
        "02_reconciliation",
        "03_generation",
        "04_evaluation",
    ]

    for stage_name in stages:
        mod = load_stage(stage_name)
        mod.run()

    rprint(Rule("[dim]Trace Builder[/dim]"))
    bt = load_script("build_traces")
    bt.run()

    rprint(Rule("[bold green]Pipeline complete[/bold green]"))
    rprint("Outputs written to [green]data/outputs/[/green]")
    rprint("Trace + UI data written to [green]data/outputs/traces/[/green] and [green]ui/public/data/[/green]")


if __name__ == "__main__":
    main()
