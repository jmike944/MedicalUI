"use client"

import { motion, type HTMLMotionProps } from "motion/react"

/** Fades and lifts its children in on mount. Used to stagger the dashboard's first paint. */
export function Reveal({
  delay = 0,
  y = 14,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  )
}
