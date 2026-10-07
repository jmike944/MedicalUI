import type { Transition } from "motion/react"

/** Delay between consecutive rows in the sidebar's first-paint cascade. */
export const ENTER_STAGGER = 0.035
/** The logo plays first; nav rows start once it has landed. */
const ENTER_BASE = 0.22

/** Entrance delay (seconds) for the n-th row of the sidebar, top to bottom. */
export function enterDelay(step: number) {
  return ENTER_BASE + step * ENTER_STAGGER
}

/** Quick, well-damped spring for rows and highlights. */
export const snappySpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.7,
}

/** Springier variant with visible overshoot, for pops and icon nudges. */
export const bouncySpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 18,
  mass: 0.7,
}

/** The active-item pill gliding between rows. */
export const pillSpring: Transition = {
  type: "spring",
  stiffness: 430,
  damping: 36,
  mass: 0.8,
}
