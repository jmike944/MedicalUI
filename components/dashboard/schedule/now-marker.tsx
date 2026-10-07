"use client"

import { motion, useReducedMotion } from "motion/react"

import { NOW } from "@/lib/schedule-data"
import { formatClock, formatTime, hourToPercent } from "@/lib/schedule-time"

import { useIntroTiming } from "./board-context"
import { EASE_OUT } from "./timeline-layout"

/**
 * The "now" line across the day timeline. Sits above the blocks like the design: the line draws
 * downward once the blocks have revealed, then the time pill pops in and keeps a soft halo.
 */
export function NowMarker() {
  const { at } = useIntroTiming()
  const reduceMotion = useReducedMotion()
  const lineDelay = at(1.0, 0.1)
  const pillDelay = at(0.88, 0.05)

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 left-[184px] z-20">
      <div className="absolute inset-y-0" style={{ left: `${hourToPercent(NOW)}%` }}>
        <motion.div
          aria-hidden
          className="absolute inset-y-0 -left-px w-0.5 origin-top rounded-full bg-primary"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: lineDelay, duration: 0.7, ease: EASE_OUT }}
        />
        {/* The pill sits on the "Open shifts" strip: 2px offset + half of its 44px height. */}
        <div className="absolute top-[24px] left-0 flex w-0 -translate-y-1/2 justify-center">
          <motion.div
            className="relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              scale: { delay: pillDelay, type: "spring", stiffness: 480, damping: 20 },
              opacity: { delay: pillDelay, duration: 0.15 },
            }}
          >
            {/* A soft halo that grows by the same few pixels on every side of the pill. */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/30"
              // Scale is pinned in `initial` so the server (which can't see reduced motion) and a
              // reduced-motion client render the same transform; otherwise hydration mismatches.
              initial={{ opacity: 0, scaleX: 1, scaleY: 1 }}
              animate={reduceMotion ? undefined : { scaleX: [1, 1.36], scaleY: [1, 1.7], opacity: [0.5, 0] }}
              transition={{
                duration: 2.2,
                ease: [0, 0, 0.2, 1],
                repeat: Infinity,
                repeatDelay: 0.4,
                delay: pillDelay + 0.4,
              }}
            />
            <time
              dateTime={formatClock(NOW).padStart(5, "0")}
              aria-label={`Now, ${formatTime(NOW)}`}
              className="relative flex h-[26px] items-center rounded-full bg-primary px-2.5 text-[13px] leading-none font-medium text-primary-foreground tabular-nums"
            >
              {formatClock(NOW)}
            </time>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
