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

// ── Trace types ───────────────────────────────────────────────────────────────

export interface TraceIntent {
  id: string
  source_row: number
  feature_area: string
  action_description: string
  expected_behavior: string
  preconditions: string[]
  test_data_hints: string[]
  original_text: string
}

export interface TraceObservation {
  id: string
  timestamp: string
  session_id: string
  summary: string
  endpoint: string
  request: Record<string, unknown>
  response: Record<string, unknown>
  context: Record<string, unknown>
}

export interface TraceReconciliation {
  id: string
  intent_id: string
  matched_observations: string[]
  decision: string
  confidence: number
  reasoning: string
  final_expected_behavior: string
}

export interface AlternativeConsidered {
  level: string
  reason_rejected: string
  _demo_synthetic?: boolean
}

export interface TraceClassification {
  level: string
  reasoning: string
  alternatives_considered: AlternativeConsidered[]
}

export interface AlternativeRejected {
  draft_summary: string
  reason_rejected: string
  _demo_synthetic?: boolean
}

export interface TraceGeneration {
  prompt_template: string
  model: string
  tokens_in: number
  tokens_out: number
  latency_ms: number
  attempt_number: number
  alternatives_rejected: AlternativeRejected[]
  _synthetic_fields?: string[]
}

export interface TraceDimension {
  name: string
  score: number
  weight: number
  notes: string
}

export interface TraceEval {
  dimensions: TraceDimension[]
  composite: number
  gate_decision: string
}

export interface TraceValidation {
  ran_against_current: boolean
  mutation_caught: boolean
  mutation_notes?: string
  flake_signals: string[]
  _demo_synthetic?: boolean
}

export interface TraceCommit {
  pr_number: number
  signing_status: string
  branch: string
  timestamp: string
  _demo_synthetic?: boolean
}

export interface SteeringSignal {
  rule_id: string
  rule_text: string
  set_on: string
  set_by: string
  _demo_synthetic?: boolean
}

export interface TraceData {
  test_id: string
  source_intents: TraceIntent[]
  source_observations: TraceObservation[]
  reconciliation: TraceReconciliation
  classification: TraceClassification
  generation: TraceGeneration
  eval: TraceEval
  validation: TraceValidation
  commit_metadata: TraceCommit
  steering_signals_applied: SteeringSignal[]
}
