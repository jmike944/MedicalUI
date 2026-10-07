"use client"

import * as React from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

const EASE_OUT = [0.22, 1, 0.36, 1] as const
/** Live updates (a filled shift, an accepted suggestion) settle quickly so counters stay in step. */
const UPDATE_DURATION = 0.5

/**
 * Set once the first counter has hydrated. Counters that mount after that (a remount, a view
 * switch) are not part of the page's entrance, so they show their value instead of counting up.
 */
let entranceOver = false

/**
 * Where the entrance count-up starts. Totals are facts, so it starts close to the real value
 * rather than at 0 (no "6 visits" on load), and small counts don't tick at all.
 */
function defaultFrom(value: number) {
  return Math.abs(value) < 10 ? value : Math.floor(value * 0.9)
}

/**
 * Counts up to `value` when it scrolls into view, then tweens to any new value.
 * Renders plain text, so it can sit inside headings, badges and buttons.
 *
 * `delay` and `duration` shape the entrance only; later changes use a short, undelayed tween so
 * every counter on the page lands together.
 */
export function AnimatedNumber({
  value,
  from,
  decimals = 0,
  duration = 0.9,
  delay = 0,
  className,
}: {
  value: number
  /** Value the entrance count-up starts from. Defaults to about 90% of `value` (or `value` below 10). */
  from?: number
  decimals?: number
  duration?: number
  delay?: number
  className?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()
  // Server and hydrating client agree on this (the flag is only set after hydration), so the
  // first paint already shows the starting number.
  const [start] = React.useState(() => (entranceOver ? value : (from ?? defaultFrom(value))))
  const current = React.useRef(start)
  const hasRun = React.useRef(false)
  const format = React.useCallback((n: number) => n.toFixed(decimals), [decimals])

  React.useEffect(() => {
    entranceOver = true
  }, [])

  React.useEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    const isEntrance = !hasRun.current
    hasRun.current = true
    if (reduceMotion || current.current === value) {
      current.current = value
      node.textContent = format(value)
      return
    }
    const controls = animate(current.current, value, {
      duration: isEntrance ? duration : Math.min(duration, UPDATE_DURATION),
      delay: isEntrance ? delay : 0,
      ease: EASE_OUT,
      onUpdate: (latest) => {
        current.current = latest
        node.textContent = format(latest)
      },
    })
    return () => controls.stop()
  }, [value, inView, reduceMotion, duration, delay, format])

  // The ticking digits are visual only; assistive tech (and accessible names built from this
  // text) always get the final value.
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span ref={ref} aria-hidden>
        {format(start)}
      </span>
      <span className="sr-only select-none">{format(value)}</span>
    </span>
  )
}
