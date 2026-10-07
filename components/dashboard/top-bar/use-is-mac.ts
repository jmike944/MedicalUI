"use client"

import * as React from "react"

const subscribe = () => () => {}

function getIsMac() {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}

/**
 * Whether shortcuts should read ⌘ (Apple) or Ctrl. The server snapshot assumes ⌘ so the
 * hydrated markup matches; React swaps it after hydration on other platforms.
 */
export function useIsMac() {
  return React.useSyncExternalStore(subscribe, getIsMac, () => true)
}
