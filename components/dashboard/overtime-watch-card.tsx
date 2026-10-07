"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion } from "motion/react"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { CardHeading, glanceCardClassName } from "@/components/dashboard/cards/card-heading"
import { SparkleBurst } from "@/components/dashboard/cards/sparkle-burst"
import { useEntranceTiming } from "@/components/dashboard/cards/use-entrance-timing"
import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { Reveal } from "@/components/dashboard/reveal"
import { isOvertimeRisk, useScheduleData } from "@/components/dashboard/schedule-store"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EASE_IN_EXIT, rise } from "@/lib/motion"
import type { Caregiver } from "@/lib/schedule-data"
import { formatDecimal, formatHours } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

const CARD_DELAY = 0.5
/**
 * How long a caregiver who just dropped below the threshold stays on screen, so the bar can
 * drain and the savings can land before the row leaves.
 */
const LINGER_MS = 1600

/**
 * Caregivers at risk of overtime, plus any who just dropped below the threshold.
 * Those linger briefly so their bar animates down before the row leaves.
 */
function useOvertimeRows() {
  const { caregivers, overtimeCaregivers } = useScheduleData()
  const atRiskKey = overtimeCaregivers.map((c) => c.id).join(",")
  const [previousKey, setPreviousKey] = React.useState(atRiskKey)
  const [lingering, setLingering] = React.useState<string[]>([])

  // Adjust state during render when the at-risk set changes (no effect round-trip).
  if (atRiskKey !== previousKey) {
    const now = new Set(atRiskKey ? atRiskKey.split(",") : [])
    const dropped = previousKey ? previousKey.split(",").filter((id) => !now.has(id)) : []
    setPreviousKey(atRiskKey)
    setLingering((ids) => [...ids.filter((id) => !now.has(id)), ...dropped])
  }

  React.useEffect(() => {
    if (lingering.length === 0) return
    const timeout = window.setTimeout(() => setLingering([]), LINGER_MS)
    return () => window.clearTimeout(timeout)
  }, [lingering])

  return caregivers.filter((c) => isOvertimeRisk(c) || lingering.includes(c.id))
}

/** The most recent drop in a caregiver's hours, with an id so each drop can animate once. */
function useHoursDrop(hours: number) {
  const [previous, setPrevious] = React.useState(hours)
  const [drop, setDrop] = React.useState<{ id: number; amount: number } | null>(null)
  if (hours !== previous) {
    setPrevious(hours)
    if (hours < previous) setDrop((last) => ({ id: (last?.id ?? 0) + 1, amount: previous - hours }))
  }
  return drop
}

export function OvertimeWatchCard() {
  const rows = useOvertimeRows()
  const titleId = React.useId()
  // One first-paint window for the whole card, so rows that appear later animate right away.
  const entrance = useEntranceTiming(CARD_DELAY + 2.2)

  return (
    <Reveal delay={CARD_DELAY} className="h-full min-w-0">
      <Card role="region" aria-labelledby={titleId} className={glanceCardClassName}>
        <CardHeader>
          <CardHeading id={titleId} icon={Clock01Icon} delay={CARD_DELAY + 0.15}>
            Overtime watch
          </CardHeading>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col">
          <ul className="relative mt-0.5 flex flex-col gap-[13px]">
            <AnimatePresence mode="popLayout">
              {rows.map((caregiver, index) => (
                <motion.li
                  key={caregiver.id}
                  layout
                  className="flex items-center gap-[11px]"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { ...rise, delay: entrance.at(CARD_DELAY + 0.25 + index * 0.08) },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    y: -6,
                    filter: "blur(4px)",
                    // Fade out ahead of the row below sliding up into its place.
                    transition: { duration: 0.3, ease: EASE_IN_EXIT, opacity: { duration: 0.18 } },
                  }}
                >
                  <OvertimeRow
                    caregiver={caregiver}
                    delay={entrance.at(CARD_DELAY + 0.35 + index * 0.08)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <AnimatePresence>
            {rows.length === 0 ? (
              <motion.div
                key="empty"
                className="flex flex-1"
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: 0.22 } }}
                exit={{ opacity: 0 }}
              >
                <Empty className="gap-2 p-0">
                  <EmptyHeader className="gap-1">
                    <EmptyMedia
                      variant="icon"
                      className="mb-1 size-11 rounded-full bg-accent text-accent-foreground"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} />
                    </EmptyMedia>
                    <EmptyTitle className="text-base">No one near overtime</EmptyTitle>
                    <EmptyDescription>Every caregiver is under 90% of their weekly hours.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </Reveal>
  )
}

function OvertimeRow({ caregiver, delay }: { caregiver: Caregiver; delay: number }) {
  const { name, avatar, weeklyHours, weeklyLimit } = caregiver
  const atRisk = isOvertimeRisk(caregiver)
  const decimals = Number.isInteger(weeklyHours) ? 0 : 1
  const drop = useHoursDrop(weeklyHours)

  return (
    <>
      <span className="relative flex shrink-0">
        <PersonAvatar name={name} src={avatar} className="size-[42px]" />
        {/* Out of the danger zone: celebrate before the row leaves. */}
        {atRisk ? null : <SparkleBurst />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] leading-5 font-medium tracking-[-0.02em]">{name}</span>
          <span
            className={cn(
              "relative shrink-0 text-sm leading-5 text-warning-foreground tabular-nums transition-colors duration-500",
              !atRisk && "text-muted-foreground"
            )}
          >
            <AnimatedNumber value={weeklyHours} decimals={decimals} delay={delay} /> of {weeklyLimit} h
            {drop ? <SavedChip key={drop.id} amount={drop.amount} /> : null}
          </span>
        </div>
        <HoursBar caregiver={caregiver} delay={delay} />
      </div>
    </>
  )
}

/** "−1.5 h" that floats up off the hours label when a caregiver's load drops. */
function SavedChip({ amount }: { amount: number }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute right-0 bottom-full rounded-full bg-primary px-1.5 text-xs leading-5 font-medium text-primary-foreground"
      initial={{ opacity: 0, y: 10, scale: 0.7 }}
      animate={{ opacity: [0, 1, 1, 0], y: -2, scale: 1 }}
      transition={{
        y: { type: "spring", stiffness: 400, damping: 25 },
        scale: { type: "spring", stiffness: 400, damping: 25 },
        opacity: { duration: 1.5, times: [0, 0.12, 0.7, 1] },
      }}
    >
      −{formatHours(amount)}
    </motion.span>
  )
}

/** Weekly hours against the limit: solid fill for hours used, hatching for what is left. */
function HoursBar({ caregiver, delay }: { caregiver: Caregiver; delay: number }) {
  const { name, weeklyHours, weeklyLimit } = caregiver
  const ratio = Math.min(1, weeklyHours / weeklyLimit)
  const left = Math.max(0, weeklyLimit - weeklyHours)
  const atRisk = isOvertimeRisk(caregiver)

  // Not a tab stop: a progressbar isn't interactive. The value text carries what the hover
  // tooltip shows, so keyboard and screen reader users get it without focusing the bar.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="progressbar"
          aria-label={`${name}’s weekly hours`}
          aria-valuemin={0}
          aria-valuemax={weeklyLimit}
          aria-valuenow={weeklyHours}
          aria-valuetext={`${formatDecimal(weeklyHours)} of ${weeklyLimit} hours, ${formatDecimal(left)} left before overtime`}
          className="relative h-2 w-full rounded-full"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-hatched [--hatch-size:6px]"
            style={{ backgroundColor: "transparent" }}
          />
          <motion.span
            aria-hidden
            className={cn(
              "absolute inset-0 origin-left rounded-full bg-warning transition-colors duration-500",
              !atRisk && "bg-primary"
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ratio }}
            transition={{ type: "spring", stiffness: 90, damping: 18, mass: 1, delay }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>{formatHours(left)} left before overtime</TooltipContent>
    </Tooltip>
  )
}
