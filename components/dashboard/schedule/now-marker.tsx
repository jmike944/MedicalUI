"use client"

import { motion, useReducedMotion } from "motion/react"

import { NOW } from "@/lib/schedule-data"
import { formatClock, hourToPercent } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

import { useIntroTiming } from "./board-context"
import { BOUNCY, EASE_OUT, TRACK_OVERLAY } from "./timeline-layout"

/*
 * The halo's grow-and-fade, with its rest built into the keyframes instead of `repeatDelay`, and
 * written as a whole `transform`: both keep Motion on the browser's animation engine, so the
 * pulse runs on the compositor rather than the main thread.
 */
const HALO_KEYFRAMES = {
  transform: ["scale(1, 1)", "scale(1.36, 1.7)", "scale(1.36, 1.7)"],
  opacity: [0.5, 0, 0],
}

/**
 * The "now" line across the day timeline. Sits above the blocks like the design: the line draws
 * downward once the blocks have revealed, then the time pill pops in and breathes a soft halo.
 */
export function NowMarker() {
  const { at } = useIntroTiming()
  const reduceMotion = useReducedMotion()
  const lineDelay = at(1.0, 0.1)
  const pillDelay = at(0.88, 0.05)

  return (
    <div className={cn(TRACK_OVERLAY, "pointer-events-none z-20")}>
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
              scale: { ...BOUNCY, delay: pillDelay },
              opacity: { delay: pillDelay, duration: 0.15 },
            }}
          >
            {/* A soft halo that grows by the same few pixels on every side of the pill. Two
                breaths once the pill lands, then it rests (WCAG 2.2.2: nothing loops for good). */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/30 motion-reduce:hidden"
              // Pinned in `initial` so the server (which can't see reduced motion) and a
              // reduced-motion client render the same transform; otherwise hydration mismatches.
              initial={{ opacity: 0, transform: "scale(1, 1)" }}
              animate={reduceMotion ? undefined : HALO_KEYFRAMES}
              transition={{
                duration: 2.4,
                times: [0, 0.85, 1],
                ease: [0, 0, 0.2, 1],
                repeat: 1,
                delay: pillDelay + 0.4,
              }}
            />
            <time
              dateTime={formatClock(NOW).padStart(5, "0")}
              className="relative flex h-[26px] items-center rounded-full bg-primary px-[7.5px] text-[13px] leading-none font-medium text-primary-foreground tabular-nums"
            >
              <span className="sr-only">Now, </span>
              {formatClock(NOW)}
            </time>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
