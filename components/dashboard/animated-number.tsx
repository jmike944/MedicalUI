"use client"

import * as React from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

/**
 * Counts up to `value` when it scrolls into view, then tweens to any new value.
 * Renders plain text, so it can sit inside headings, badges and buttons.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.9,
  delay = 0,
  className,
}: {
  value: number
  decimals?: number
  duration?: number
  delay?: number
  className?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()
  const current = React.useRef(0)
  const format = React.useCallback((n: number) => n.toFixed(decimals), [decimals])

  React.useEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    if (reduceMotion) {
      current.current = value
      node.textContent = format(value)
      return
    }
    const controls = animate(current.current, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        current.current = latest
        node.textContent = format(latest)
      },
    })
    return () => controls.stop()
  }, [value, inView, reduceMotion, duration, delay, format])

  // The ticking digits are visual only; assistive tech (and accessible names built from this
  // text) always get the final value. Always render 0 first so server and client markup match.
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span ref={ref} aria-hidden>
        {format(0)}
      </span>
      <span className="sr-only select-none">{format(value)}</span>
    </span>
  )
}
