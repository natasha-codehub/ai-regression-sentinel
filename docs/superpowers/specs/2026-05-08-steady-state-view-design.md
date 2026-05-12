# Steady-State View (Chapter B) — Design Spec
*Date: 2026-05-08*

## Overview

Replace the `SteadyStatePanel` placeholder with a fully interactive Chapter B demo view. The view simulates a Sentinel analysis triggered by a GitHub PR and reveals three data panels: a diff viewer, an impact graph, and a generated PR comment.

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  PR #2387: "Fix tax calculation…"     [Run Sentinel] │  ← PRBanner (always visible)
└─────────────────────────────────────────────────────┘
        ↓ (3-sec animation, then fade-in)
┌─────────────────────┬───────────────────────────────┐
│                     │  Impact Graph (react-flow)     │
│  Diff Viewer        │  ○ delete   ○ execute          │
│  (PaymentMethods    │     ↓            ↓             │
│   hunk only)        │  □ GEN-010  □ GEN-001          │
│                     │  [legend: ● Code  ■ Test]      │
│                     ├────────────────────────────────│
│                     │  Generated PR Comment          │
│                     │  (react-markdown + Copy btn)   │
└─────────────────────┴───────────────────────────────┘
```

- Two-column split: left ~55% (diff), right ~45% (graph on top, PR comment on bottom)
- The two right panels have a `border-b border-slate-800` divider between them
- Full height panel, `overflow-y-auto` on the outer container

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `react-diff-viewer-continued` | Git-style syntax-highlighted diff |
| `reactflow` | Impact graph |
| `react-markdown` | Render PR comment markdown |

---

## Files Created / Modified

| Path | Action |
|------|--------|
| `ui/src/panels/SteadyStatePanel.tsx` | Full replace of placeholder |
| `ui/src/hooks/useSteadyStateData.ts` | New hook — fetches all 3 data sources |
| `ui/src/components/steady-state/DiffViewer.tsx` | New component |
| `ui/src/components/steady-state/ImpactGraph.tsx` | New component |
| `ui/src/components/steady-state/PRCommentPanel.tsx` | New component |
| `ui/src/types.ts` | Add `ChangeImpact`, `ChangedSymbol`, `AffectedTest` types |
| `ui/public/data/sample_diff.patch` | Copied from `data/fixtures/sample_diff.patch` |

---

## Component Details

### `useSteadyStateData` hook

Fetches three resources in parallel:
- `/data/05_change_impact.json` → typed as `ChangeImpact | null`
- `/data/06_pr_comment.md` → raw string (`text()` not `json()`) | `null`
- `/data/sample_diff.patch` → raw string | `null`

Returns `{ changeImpact, prComment, patchText, loading }`.

Missing files return `null` — consumers show empty state, never crash.

### `SteadyStatePanel`

State machine: `'idle' | 'running' | 'done'`.

- **idle**: shows PRBanner only. Run Sentinel button is enabled.
- **running**: PRBanner + analysis animation. `useEffect` with `setTimeout(3000)` transitions to `done`.
- **done**: PRBanner + 2-column layout fades in (`opacity-0 → opacity-100` transition, 300ms).

PRBanner is always mounted. The 2-column content only mounts when state is `'done'`.

### `DiffViewer`

Receives `patchText: string | null`.

**Patch parsing** — client-side, first file only:
1. Find the first `--- a/` header, stop at the second `--- a/` (ignore second file).
2. Walk hunk lines: ` ` → append to both old/new, `-` → old only, `+` → new only. Skip `@@` and `diff --git` meta lines.
3. Pass `oldValue` and `newValue` to `react-diff-viewer-continued` with `useDarkTheme splitView={false}` (unified view to save horizontal space).

If `patchText` is null → empty state.

### `ImpactGraph`

Receives `changeImpact: ChangeImpact | null`.

**Node layout** (static, no drag):
- Code symbol nodes: `type: 'codeNode'`, positioned at y=50, evenly spaced across x
- Test nodes: `type: 'testNode'`, positioned at y=220, evenly spaced across x

**Edge inference** — filename prefix matching:
- `PaymentMethodDeletionTest.php` → `delete` in `PaymentMethods.php`
- `OnboardingProcessTest.php` → `execute` in `Save.php`
- Fallback for unmatched tests: connect to all code symbols

**Custom nodes:**
- `codeNode`: orange circle (`bg-orange-500/20 border-2 border-orange-500`), label = `name\nfile`
- `testNode`: blue square (`bg-blue-500/20 border-2 border-blue-500`), label = test filename

**Legend**: small inline block below graph — `● Code Symbol` (orange) and `■ Test` (blue), `text-xs font-mono`.

ReactFlow config: `fitView`, `nodesDraggable={false}`, `zoomOnScroll={false}`, `panOnDrag={false}`. Fixed height ~280px.

If `changeImpact` is null → empty state.

### `PRCommentPanel`

Receives `prComment: string | null`.

- Renders markdown via `react-markdown` with custom prose styling (no external CSS, inline Tailwind via `components` prop)
- Copy button top-right: uses `navigator.clipboard.writeText`. Shows "Copied!" for 2s then resets.
- If `prComment` is null → empty state.

### Empty State

Used by DiffViewer, ImpactGraph, and PRCommentPanel when their data is null:

```
┌──────────────────────────────────────────┐
│  No data                                  │
│  Run scripts/run_steady_state.py          │
│  to generate this                         │
└──────────────────────────────────────────┘
```
`border border-slate-800 rounded-lg p-5`, `text-xs font-mono text-slate-500`

---

## Types to Add (`types.ts`)

```typescript
export interface ChangedSymbol {
  type: string
  name: string
  file: string
}

export interface AffectedTest {
  test_id: string
  test_filename: string
  reason: string
}

export interface TestRecommendation {
  description: string
  reason: string
}

export interface ChangeImpact {
  diff_summary: string
  changed_symbols: ChangedSymbol[]
  affected_tests: AffectedTest[]
  new_test_recommendations: TestRecommendation[]
}
```

---

## Design Tokens (consistent with existing UI)

- Background: `slate-950`
- Borders: `slate-800`
- Text: `slate-200` (primary), `slate-500` (secondary), `slate-600` (muted)
- Accent: `blue-500`
- Code nodes: `orange-500`
- Test nodes: `blue-500`
- Font: `font-mono` for all labels and code

---

## Animation

3-second analysis animation on "Run Sentinel" click:
- Button text changes to "Analysing…" and becomes disabled
- A `w-full h-0.5 bg-slate-800` progress bar below the banner fills from 0→100% over 3s using a CSS transition on `width`
- After 3s: state → `'done'`, content area fades in over 300ms

---

## Out of Scope

- No wiring between Steady-State and Trace tab (Trace → button is Chapter C)
- No actual API calls — all data is static files in `ui/public/data/`
- No re-run / reset of just the Steady-State panel (global Reset Demo button handles this)
