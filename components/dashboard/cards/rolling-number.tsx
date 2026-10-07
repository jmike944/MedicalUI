"use client"

import * as React from "react"
import { AnimatePresence, motion, useIsPresent, type Variants } from "motion/react"

import { cn } from "@/lib/utils"

const roll = { type: "spring", stiffness: 520, damping: 34 } as const

const digitVariants: Variants = {
  enter: (direction: number) => ({ y: `${direction * 70}%`, opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  // The old value clears out quickly so the count never reads wrong mid-roll.
  exit: (direction: number) => ({
    y: `${direction * -70}%`,
    opacity: 0,
    transition: { ...roll, opacity: { duration: 0.1 } },
  }),
}

/**
 * A small count that always shows its real value and rolls to a new one: down when it
 * drops, up when it grows. Unlike a count-up it never shows an in-between number, so
 * copy around it ("1 suggestion") can depend on `value` directly.
 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = React.useState(value)
  const [direction, setDirection] = React.useState(1)
  if (shown !== value) {
    setShown(value)
    setDirection(value < shown ? -1 : 1)
  }

  return (
    <span className={cn("relative inline-flex overflow-hidden tabular-nums", className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <Digit key={value} direction={direction}>
          {value}
        </Digit>
      </AnimatePresence>
    </span>
  )
}

function Digit({
  direction,
  children,
  ref,
}: {
  direction: number
  children: React.ReactNode
  ref?: React.Ref<HTMLSpanElement>
}) {
  // The outgoing value lingers while it rolls away; keep it out of the accessible name.
  const isPresent = useIsPresent()
  return (
    <motion.span
      ref={ref}
      aria-hidden={isPresent ? undefined : true}
      custom={direction}
      variants={digitVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={roll}
      className="inline-block"
    >
      {children}
    </motion.span>
  )
}
