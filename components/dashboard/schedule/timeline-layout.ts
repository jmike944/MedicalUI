import type * as React from "react"

import { DAY_START } from "@/lib/schedule-data"
import { hourToPercent, spanToPercent } from "@/lib/schedule-time"

/** Shared easing for entrances: fast out, gentle settle. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Spring used when a block glides between rows (reassignments and filled shifts). */
export const GLIDE = { type: "spring", stiffness: 240, damping: 30, mass: 0.9 } as const

/** Clip-path frames for the left-to-right block reveal. */
export const CLIP_HIDDEN = "inset(0% 100% 0% 0% round 999px)"
export const CLIP_SHOWN = "inset(0% 0% 0% 0% round 999px)"

/** Panel base for `bg-hatched` surfaces (the utility sets the same colour; kept inline for motion overlays). */
export const HATCH_BASE: React.CSSProperties = { backgroundColor: "var(--color-panel)" }

/** Gap between a block and the hour gridlines on either side. */
const BLOCK_INSET = 2

/** Absolute position of a block on the timeline track, inset from the hour gridlines. */
export function blockPosition(start: number, end: number): React.CSSProperties {
  return {
    left: `calc(${hourToPercent(start)}% + ${BLOCK_INSET}px)`,
    width: `calc(${spanToPercent(start, end)}% - ${BLOCK_INSET * 2}px)`,
  }
}

/** Height of a caregiver lane, in px. */
export const ROW_HEIGHT = 40

/**
 * Presence animation for a caregiver lane. On first paint lanes fade up in a cascade; when the
 * caregiver filter adds or removes lanes they expand or collapse, so everything below (legend,
 * card edge, the cards underneath) slides smoothly instead of jumping.
 */
export function rowPresence(intro: boolean, delay: number) {
  return {
    initial: intro
      ? { opacity: 0, y: 10 }
      : { opacity: 0, height: 0, overflow: "hidden" as const },
    animate: {
      opacity: 1,
      y: 0,
      height: ROW_HEIGHT,
      transitionEnd: { overflow: "visible" as const },
    },
    exit: {
      opacity: 0,
      height: 0,
      overflow: "hidden" as const,
      transition: {
        height: { duration: 0.32, ease: EASE_OUT },
        opacity: { duration: 0.16 },
      },
    },
    transition: {
      y: { duration: 0.45, ease: EASE_OUT, delay: intro ? delay : 0 },
      opacity: { duration: 0.35, ease: EASE_OUT, delay: intro ? delay : 0.1 },
      height: { duration: 0.32, ease: EASE_OUT },
    },
  }
}

/** Entrance delay for a block: rows cascade top to bottom, blocks sweep left to right. */
export function revealDelay(rowIndex: number, start: number) {
  return 0.32 + rowIndex * 0.045 + (start - DAY_START) * 0.035
}
