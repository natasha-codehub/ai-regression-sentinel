"""Thin wrapper around the Anthropic SDK used by all agents."""

import json
import os
import time

import anthropic
from dotenv import load_dotenv
from rich import print as rprint

load_dotenv()

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set in environment / .env")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def call_claude(prompt: str, model: str, system: str | None = None) -> str:
    """Call Claude and return the raw text response."""
    client = _get_client()
    messages = [{"role": "user", "content": prompt}]
    kwargs: dict = {"model": model, "max_tokens": 4096, "messages": messages}
    if system:
        kwargs["system"] = system

    start = time.perf_counter()
    response = client.messages.create(**kwargs)
    elapsed = time.perf_counter() - start

    usage = response.usage
    rprint(
        f"[dim]  ↳ {model} | "
        f"in={usage.input_tokens} out={usage.output_tokens} | "
        f"{elapsed:.1f}s[/dim]"
    )
    return response.content[0].text


def call_claude_json(prompt: str, model: str, schema: dict, system: str | None = None) -> dict:
    """Call Claude expecting a JSON response; validates and returns parsed dict."""
    system_with_schema = (system or "") + (
        f"\n\nYou MUST respond with valid JSON that conforms to this schema:\n"
        f"{json.dumps(schema, indent=2)}\n"
        "Output ONLY the JSON object — no markdown fences, no explanation."
    )
    raw = call_claude(prompt, model, system=system_with_schema)

    # Strip accidental markdown fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = "\n".join(cleaned.split("\n")[1:])
    if cleaned.endswith("```"):
        cleaned = "\n".join(cleaned.split("\n")[:-1])

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        rprint(f"[red]JSON parse error:[/red] {exc}")
        rprint(f"[dim]Raw response:\n{raw[:500]}[/dim]")
        raise
