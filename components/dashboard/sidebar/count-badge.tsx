"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"

import { SidebarMenuBadge } from "@/components/ui/sidebar"
import { bouncySpring } from "./motion"

/**
 * Solid count bubble at the end of a nav row. Springs in after its row lands,
 * and when the count changes the digits roll and the bubble pops.
 */
export function CountBadge({ value, delay = 0 }: { value: number; delay?: number }) {
  const reduceMotion = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLSpanElement>()

  // Digits roll down when the count drops and up when it grows.
  const [shown, setShown] = React.useState(value)
  const [direction, setDirection] = React.useState(1)
  if (shown !== value) {
    setShown(value)
    setDirection(value < shown ? -1 : 1)
  }

  const popped = React.useRef(value)
  React.useEffect(() => {
    if (popped.current === value) return
    popped.current = value
    if (reduceMotion || !scope.current) return
    animate(
      scope.current,
      { scale: [1, 1.32, 0.94, 1] },
      { duration: 0.5, times: [0, 0.35, 0.7, 1], ease: "easeOut" }
    )
  }, [value, animate, scope, reduceMotion])

  return (
    <SidebarMenuBadge
      aria-hidden
      className="right-[11px] z-[1] h-6 min-w-6 rounded-full p-0 peer-data-[size=default]/menu-button:top-2"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.18 } }}
        transition={{ ...bouncySpring, delay, opacity: { duration: 0.2, delay } }}
        className="flex"
      >
        <span
          ref={scope}
          className="relative flex h-6 min-w-6 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary px-1.5 text-xs font-medium text-sidebar-primary-foreground tabular-nums"
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.span
              key={value}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ y: dir * 12, opacity: 0 }),
                center: { y: 0, opacity: 1 },
                exit: (dir: number) => ({ y: dir * -12, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 600, damping: 32 }}
              className="block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.span>
    </SidebarMenuBadge>
  )
}
