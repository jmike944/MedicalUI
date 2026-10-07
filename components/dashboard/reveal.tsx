"use client"

import { motion, type HTMLMotionProps } from "motion/react"

import { EASE_OUT } from "@/lib/motion"

/**
 * Fades and lifts its children in on mount. Used to stagger the dashboard's first paint.
 * With "reduce motion" on, MotionProvider skips the animation (and its delay) entirely.
 */
export function Reveal({
  delay = 0,
  y = 14,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(4px)" }}
      // Drop the filter once settled: a lingering `blur(0px)` keeps an extra compositing layer
      // and can soften text in some browsers.
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      {...props}
    />
  )
}
