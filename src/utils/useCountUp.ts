'use client'

import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const previousTargetRef = useRef(target)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    if (target === previousTargetRef.current && value > 0) {
      return
    }
    previousTargetRef.current = target

    cancelAnimationFrame(rafRef.current!)
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress)

      setValue(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setValue(target)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current!)
    }
  }, [target, duration, enabled])

  return value
}
