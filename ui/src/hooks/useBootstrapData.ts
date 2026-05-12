import { useState, useEffect } from 'react'
import type { Intent, Reconciliation, Generation, EvalScore, Observation } from '../types'

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export interface BootstrapData {
  intents: Intent[]
  reconciliations: Reconciliation[]
  generations: Generation[]
  evalScores: EvalScore[]
  observations: Observation[]
  loading: boolean
}

export function useBootstrapData(): BootstrapData {
  const [state, setState] = useState<Omit<BootstrapData, 'loading'>>({
    intents: [],
    reconciliations: [],
    generations: [],
    evalScores: [],
    observations: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Intent[]>('/data/01_test_intents.json'),
      fetchJson<Reconciliation[]>('/data/02_reconciliation.json'),
      fetchJson<Generation[]>('/data/03_generation.json'),
      fetchJson<EvalScore[]>('/data/04_eval_scores.json'),
      fetchJson<Observation[]>('/data/observed_behavior.json'),
    ]).then(([intents, reconciliations, generations, evalScores, observations]) => {
      setState({
        intents: intents ?? [],
        reconciliations: reconciliations ?? [],
        generations: generations ?? [],
        evalScores: evalScores ?? [],
        observations: observations ?? [],
      })
      setLoading(false)
    })
  }, [])

  return { ...state, loading }
}
