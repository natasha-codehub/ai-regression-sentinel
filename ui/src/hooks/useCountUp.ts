import { useState, useEffect } from 'react'

export function useCountUp(target: number, duration = 1000): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }
    let raf: number
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return count
}
