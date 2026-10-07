import type { CSSProperties } from "react"
import type { Transition, Variants } from "motion/react"

/** Snappy spring shared by the top bar's micro-interactions. */
export const snappy: Transition = { type: "spring", stiffness: 520, damping: 30, mass: 0.7 }

/** Parent of the entrance: org block, search, then each action button, 40ms apart. */
export const entranceContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

/** Each top bar slot drops in from 8px above. */
export const entranceItem: Variants = {
  hidden: { opacity: 0, y: -8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 30, mass: 0.8 },
  },
}

/**
 * CSS stagger for list items inside Radix/cmdk menus (pair with
 * `animate-in fade-in-0 fill-mode-backwards`). Capped so long lists don't lag.
 */
export function staggerDelay(index: number, step = 24, max = 12): CSSProperties {
  return { animationDelay: `${Math.min(index, max) * step}ms` }
}
