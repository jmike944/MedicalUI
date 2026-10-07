"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { isOvertimeRisk } from "@/components/dashboard/schedule-store"
import { HatchedCircle } from "@/components/dashboard/shared/hatched-circle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EASE_OUT, bouncier } from "@/lib/motion"
import type { Caregiver } from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

import { useIntroTiming } from "./board-context"

/*
 * Pieces shared by the day timeline and the week grid, so both views label their lanes the same
 * way and behave the same (tooltips, sticky name column, narrow-screen layout).
 */

/**
 * Name column cell: 30px avatar or swatch, then the label. It sticks to the left edge when the
 * view scrolls sideways on narrow screens, above the gridlines and now line.
 */
export function RowLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky left-0 z-30 flex h-full min-w-0 items-center gap-1 bg-card pl-2 @lg:gap-[9px] @lg:pl-[11px]",
        className
      )}
      {...props}
    />
  )
}

/** Visible name in a roomy card; when it's narrow only the avatar shows and the name stays for screen readers. */
function RowName({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("truncate text-[15px] leading-5 @max-lg:sr-only", className)} {...props} />
}

/** Overtime-risk dot after a caregiver's name. The tooltip gets a 24px hit area around the 6px dot. */
export function OvertimeDot({ caregiver }: { caregiver: Caregiver }) {
  const { at } = useIntroTiming()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span aria-hidden className="-m-[9px] flex size-6 shrink-0 items-center justify-center">
          <motion.span
            className="size-1.5 rounded-full bg-warning"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, transition: { duration: 0.2 } }}
            transition={{ ...bouncier, delay: at(0.9, 0.1) }}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        Near overtime: {caregiver.weeklyHours} of {caregiver.weeklyLimit} h this week
      </TooltipContent>
    </Tooltip>
  )
}

/** A caregiver's name cell: avatar, name and, when they're close to their limit, the overtime dot. */
export function CaregiverLabel({
  caregiver,
  className,
  ...props
}: { caregiver: Caregiver } & React.ComponentProps<"div">) {
  const atRisk = isOvertimeRisk(caregiver)
  return (
    <RowLabel className={className} {...props}>
      <PersonAvatar name={caregiver.name} src={caregiver.avatar} className="size-[30px]" />
      <RowName>{caregiver.name}</RowName>
      {/* The dot is decorative; its meaning is spelled out for screen readers here. */}
      {atRisk ? (
        <span className="sr-only">
          , near overtime: {caregiver.weeklyHours} of {caregiver.weeklyLimit} h
        </span>
      ) : null}
      <AnimatePresence>
        {atRisk ? <OvertimeDot key="overtime" caregiver={caregiver} /> : null}
      </AnimatePresence>
    </RowLabel>
  )
}

/**
 * Name cell of the Open shifts lane: a hatched circle and its label, on the lavender strip. The
 * circle is hatched finer than the blocks (5px tile), as drawn in the design.
 */
export function OpenShiftsLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <RowLabel className={cn("rounded-l-full bg-panel", className)} {...props}>
      <HatchedCircle size="sm" march="none" className="ring-hatch/70 [--hatch-size:5px]" />
      <RowName className="font-medium">Open shifts</RowName>
    </RowLabel>
  )
}

/** The lavender band behind the Open shifts lane, painted under the gridlines like the design. */
export function OpenShiftsStrip() {
  const { at } = useIntroTiming()
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0.5 h-11 origin-left rounded-full bg-panel"
      initial={{ opacity: 0, scaleX: 0.92 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: at(0.1), duration: 0.6, ease: EASE_OUT }}
    />
  )
}
