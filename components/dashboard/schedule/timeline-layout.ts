import type * as React from "react"

import { EASE_OUT } from "@/lib/motion"
import { DAY_START } from "@/lib/schedule-data"
import { hourToPercent, spanToPercent } from "@/lib/schedule-time"

/** Clip-path frames for the left-to-right block reveal. */
export const CLIP_HIDDEN = "inset(0% 100% 0% 0% round 999px)"
export const CLIP_SHOWN = "inset(0% 0% 0% 0% round 999px)"

/*
 * Name column. Defined once as a CSS variable on each view's root, keyed to the card's own width
 * (the card content is a size container): just the avatar when the card is narrow, so the
 * timeline gets the room, and the full name from 32rem up, matching the design's 184px.
 */
export const NAME_COL_VARS = "[--name-col:52px] @lg:[--name-col:184px]"
/** A day-timeline row: name column, then the hour track. */
export const ROW_GRID = "grid grid-cols-[var(--name-col)_1fr]"
/** A week-grid row: name column, then seven day columns. */
export const WEEK_GRID = "grid grid-cols-[var(--name-col)_repeat(7,minmax(0,1fr))]"
/** Overlays that cover only the hour track (gridlines, now line, sweep). */
export const TRACK_OVERLAY = "absolute inset-y-0 right-0 left-(--name-col)"

/** Gap between a block and the hour gridlines on either side. */
export const BLOCK_INSET = 2

/** Absolute position of a block on the timeline track, inset from the hour gridlines. */
export function blockPosition(start: number, end: number): React.CSSProperties {
  return {
    left: `calc(${hourToPercent(start)}% + ${BLOCK_INSET}px)`,
    width: `calc(${spanToPercent(start, end)}% - ${BLOCK_INSET * 2}px)`,
  }
}

/** Height of a caregiver lane, in px. */
export const ROW_HEIGHT = 40

/*
 * Vertical geometry of the day timeline body, in px from its top edge. Mirrors the markup:
 * the Open shifts lane (2px margin + 44px), an 8px gap, then one 40px lane per caregiver.
 * Open shift blocks (32px) sit 10px into their lane (`top-2.5`), a touch below its centre.
 */
export const OPEN_SHIFTS_CENTER = 2 + 10 + 32 / 2
export const LANES_TOP = 2 + 44 + 8
export function laneCenter(index: number) {
  return LANES_TOP + index * ROW_HEIGHT + ROW_HEIGHT / 2
}

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

/**
 * Entrance delay for an AI suggestion ghost, keyed to its position on the track so ghosts
 * materialize in the wake of the optimizer's sweep, left to right.
 */
export function ghostDelay(start: number) {
  return 0.08 + (hourToPercent(start) / 100) * 0.5
}
