import { useState, useEffect } from 'react'

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

export interface NewTestRecommendation {
  description: string
  reason: string
}

export interface ChangeImpact {
  diff_summary: string
  changed_symbols: ChangedSymbol[]
  affected_tests: AffectedTest[]
  new_test_recommendations: NewTestRecommendation[]
}

export interface SteadyStateData {
  impact: ChangeImpact | null
  prComment: string | null
  diffText: string | null
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

export function useSteadyStateData(): SteadyStateData {
  const [data, setData] = useState<SteadyStateData>({
    impact: null,
    prComment: null,
    diffText: null,
  })

  useEffect(() => {
    Promise.all([
      fetchJson<ChangeImpact>('/data/05_change_impact.json'),
      fetchText('/data/06_pr_comment.md'),
      fetchText('/data/sample_diff.patch'),
    ]).then(([impact, prComment, diffText]) => {
      setData({ impact, prComment, diffText })
    })
  }, [])

  return data
}
