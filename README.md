# Sentinel Prototype

Agentic AI regression testing platform — CEO demo.

## Setup

```bash
# Install uv if you don't have it
pip install uv

# Install dependencies
cd sentinel-prototype
uv sync
```

## Configure API key

Edit `.env` and replace `your_key_here`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Run the pipeline

```bash
uv run python scripts/run_pipeline.py
```

Outputs are written to `data/outputs/`. Each stage reads the previous stage's JSON and writes its own.

## Project layout

```
data/inputs/          Manual test artifacts (XLSX, PHP source)
data/fixtures/        Curated observed behavior + sample diff
data/outputs/         Pipeline writes here (git-ignored)
prompts/              Versioned Claude prompt templates
agents/               One Python file per pipeline stage
scripts/              Orchestrators (run_pipeline.py, run_steady_state.py)
ui/                   Frontend (Vite + React + TS)
```
