import type { CSSProperties } from "react"
import type { Transition } from "motion/react"

/*
 * Motion presets shared by the whole dashboard: easing curves, named springs and stagger helpers.
 * Pull from here instead of repeating literals, so every region moves with one voice. One-off
 * choreography (a tuned delay, a keyframe sequence) can stay inline next to the element it moves.
 */

/* ---------------------------------------------------------------------------------------------
 * Easing curves (cubic-bezier control points, for duration-based tweens)
 * ------------------------------------------------------------------------------------------- */

/** Entrances: fast out, gentle settle (ease-out quint). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Exits: accelerate away so leaving content never lingers. */
export const EASE_IN_EXIT = [0.4, 0, 1, 1] as const

/** Symmetric ease for sweeps that travel across a whole surface. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

/* ---------------------------------------------------------------------------------------------
 * Springs, from calm to bouncy. Overshoot and settle times are for a full-distance move.
 * Pairs that share stiffness and damping but not mass (snappy/snappier, bouncy/bouncier) are kept
 * apart on purpose: the mass changes how far they overshoot and how fast they land.
 * ------------------------------------------------------------------------------------------- */

/** Default for anything without its own transition (set on MotionConfig). ~0% overshoot. */
export const settle = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 } as const satisfies Transition

/** A block gliding between rows (reassignments, filled shifts). Unhurried, no overshoot. */
export const glide = { type: "spring", stiffness: 240, damping: 30, mass: 0.9 } as const satisfies Transition

/** The active nav pill gliding between rows. No overshoot. */
export const pill = { type: "spring", stiffness: 430, damping: 36, mass: 0.8 } as const satisfies Transition

/** Rows and highlights: quick and critically damped, lands in ~240ms with no overshoot. */
export const snappy = { type: "spring", stiffness: 520, damping: 38, mass: 0.7 } as const satisfies Transition

/** `snappy` at mass 1: lands sooner (~190ms) with a hair of overshoot. Segmented-control indicators. */
export const snappier = { type: "spring", stiffness: 520, damping: 38 } as const satisfies Transition

/** Controls sliding sideways when a neighbour changes width. */
export const slide = { type: "spring", stiffness: 420, damping: 36 } as const satisfies Transition

/** Hover and tap feedback on chrome buttons: quick, ~2% overshoot. */
export const press = { type: "spring", stiffness: 520, damping: 30, mass: 0.7 } as const satisfies Transition

/** Top bar slots dropping into place on first paint. ~1% overshoot. */
export const drop = { type: "spring", stiffness: 420, damping: 30, mass: 0.8 } as const satisfies Transition

/** Card rows rising into place. ~3% overshoot. */
export const rise = { type: "spring", stiffness: 360, damping: 28 } as const satisfies Transition

/** Pills and cells popping into place. ~5% overshoot. */
export const pop = { type: "spring", stiffness: 420, damping: 28 } as const satisfies Transition

/** Icons popping or turning inside a control (card heading icons, the create "+"). ~21% overshoot. */
export const twist = { type: "spring", stiffness: 420, damping: 18 } as const satisfies Transition

/** Pops and icon nudges with a visible overshoot (~18%). */
export const bouncy = { type: "spring", stiffness: 520, damping: 18, mass: 0.7 } as const satisfies Transition

/** `bouncy` at mass 1: a bigger, slower overshoot (~26%). Small badges and dots landing. */
export const bouncier = { type: "spring", stiffness: 520, damping: 18 } as const satisfies Transition

/* ---------------------------------------------------------------------------------------------
 * Stagger helpers
 * ------------------------------------------------------------------------------------------- */

/**
 * CSS stagger for list items inside Radix/cmdk menus (pair with
 * `animate-in fade-in-0 fill-mode-backwards`). Capped so long lists don't lag.
 */
export function staggerDelay(index: number, step = 24, max = 12): CSSProperties {
  return { animationDelay: `${Math.min(index, max) * step}ms` }
}

/** The sidebar logo plays first; nav rows start once it has landed. */
const SIDEBAR_ENTER_BASE = 0.22
/** Delay between consecutive rows in the sidebar's first-paint cascade. */
const SIDEBAR_ENTER_STAGGER = 0.035

/** Entrance delay (seconds) for the n-th row of the sidebar, top to bottom. */
export function sidebarEnterDelay(step: number) {
  return SIDEBAR_ENTER_BASE + step * SIDEBAR_ENTER_STAGGER
}
