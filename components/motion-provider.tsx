"use client"

import { MotionConfig, useReducedMotion } from "motion/react"

import { settle } from "@/lib/motion"

/**
 * Shared motion defaults. With the OS "reduce motion" setting on, every motion animation (entrance
 * fades, blurs and their delays included, not just transforms) completes instantly, so content is
 * there as soon as the page hydrates. CSS animations are handled in globals.css.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false
  return (
    <MotionConfig
      reducedMotion="user"
      skipAnimations={reduceMotion}
      transition={settle}
    >
      {children}
    </MotionConfig>
  )
}
