import { useState, useEffect } from 'react'
import type { TraceData } from '../types'

export function useTraceData(testId: string | null): { trace: TraceData | null; loading: boolean } {
  const [trace, setTrace] = useState<TraceData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!testId) {
      setTrace(null)
      return
    }
    setLoading(true)
    fetch(`/data/traces/${testId}_trace.json`)
      .then((r) => (r.ok ? (r.json() as Promise<TraceData>) : null))
      .then((d) => {
        setTrace(d)
        setLoading(false)
      })
      .catch(() => {
        setTrace(null)
        setLoading(false)
      })
  }, [testId])

  return { trace, loading }
}
