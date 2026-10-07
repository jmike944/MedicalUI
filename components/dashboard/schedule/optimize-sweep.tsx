"use client"

import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

import { EASE_IN_EXIT, EASE_IN_OUT, TRACK_OVERLAY } from "./timeline-layout"

/** How long the scan line takes to cross the day; the optimizer run itself lasts a little longer. */
export const SWEEP_DURATION = 1.2

/**
 * While the optimizer runs, a scan line with a soft trailing glow travels across the day, tinting
 * every lane as it passes, so the board itself shows the work. The ghosts it finds then land in its
 * wake, left to right. Skipped under reduced motion (the toolbar still says "Optimizing…").
 */
export function OptimizeSweep() {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null

  return (
    <motion.div
      aria-hidden
      className={cn(TRACK_OVERLAY, "pointer-events-none z-10 overflow-hidden")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE_IN_EXIT } }}
      transition={{ duration: 0.2 }}
    >
      {/* A full-width carrier translated by its own width, so the move stays a compositor transform. */}
      <motion.div
        className="absolute inset-y-0 left-0 w-full"
        initial={{ transform: "translateX(0%)" }}
        animate={{ transform: "translateX(100%)" }}
        transition={{ duration: SWEEP_DURATION, ease: EASE_IN_OUT }}
      >
        <span className="absolute inset-y-0 -left-36 w-36 bg-linear-to-r from-primary/0 to-primary/12" />
        <span className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-primary shadow-[0_0_14px_3px] shadow-primary/45" />
      </motion.div>
    </motion.div>
  )
}
