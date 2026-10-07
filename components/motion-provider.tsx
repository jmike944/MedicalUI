"use client"

import { MotionConfig } from "motion/react"

/** Shared motion defaults. `reducedMotion="user"` honours the OS "reduce motion" setting everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
    >
      {children}
    </MotionConfig>
  )
}
