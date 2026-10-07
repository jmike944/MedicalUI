"use client"

import * as React from "react"

/**
 * Returns `delay` during the dashboard's first-paint choreography, then 0,
 * so later updates (new rows, changed values) animate right away.
 */
export function useEntranceDelay(delay: number) {
  const [settled, setSettled] = React.useState(false)
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setSettled(true), (delay + 1.2) * 1000)
    return () => window.clearTimeout(timeout)
  }, [delay])
  return settled ? 0 : delay
}
