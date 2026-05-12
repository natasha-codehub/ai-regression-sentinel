export type TabId = 'bootstrap' | 'steady-state' | 'trace'

export interface Tab {
  id: TabId
  label: string
  chapter: string
}

export const TABS: Tab[] = [
  { id: 'bootstrap', label: 'Bootstrap', chapter: 'Chapter A' },
  { id: 'steady-state', label: 'Steady-State', chapter: 'Chapter B' },
  { id: 'trace', label: 'Trace', chapter: 'Chapter C' },
]

// ── Pipeline data types ───────────────────────────────────────────────────────

export interface Intent {
  id: string
  source_row: number
  feature_area: string
  action_description: string
  expected_behavior: string
  preconditions: string[]
  test_data_hints: string[]
  original_text: string
}

export type RecDecision = 'agree' | 'behavior_regressed' | 'no_observation'

export interface Reconciliation {
  id: string
  intent_id: string
  matched_observations: string[]
  decision: RecDecision
  confidence: number
  reasoning: string
  final_expected_behavior: string
}

export interface Generation {
  id: string
  rec_id: string
  intent_id: string
  decision: string
  level: string
  file: string
  class: string
  source_files: string[]
  router_rationale: string
}

export interface EvalDimension {
  name: string
  score: number
  weight: number
  notes: string
}

export type GateDecision = 'PASS' | 'WARN' | 'REVIEW' | 'FAIL'

export interface EvalScore {
  id: string
  generation_id: string
  dimensions: EvalDimension[]
  composite: number
  gate_decision: GateDecision
}

export interface Observation {
  id: string
  timestamp: string
  session_id: string
  summary: string
  endpoint: string
  request: Record<string, unknown>
  response: Record<string, unknown>
  context: Record<string, unknown>
}
