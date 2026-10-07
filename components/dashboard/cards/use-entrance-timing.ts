"use client"

import * as React from "react"

/**
 * Entrance timing for one glance card. Call it once in the card and pass the resulting
 * delays down: `at(delay)` returns `delay` while the dashboard's first paint plays and 0
 * afterwards, so rows or values that appear later animate right away instead of waiting
 * out the first-paint stagger. Mirrors the schedule's `useIntroTiming().at()`.
 */
export function useEntranceTiming(settleAfterSeconds: number) {
  const [intro, setIntro] = React.useState(true)

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setIntro(false), settleAfterSeconds * 1000)
    return () => window.clearTimeout(timeout)
  }, [settleAfterSeconds])

  return React.useMemo(
    () => ({ intro, at: (delay: number) => (intro ? delay : 0) }),
    [intro]
  )
}
