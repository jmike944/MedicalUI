"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion } from "motion/react"

import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { isOvertimeRisk, useSchedule } from "@/components/dashboard/schedule-store"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Caregiver, Visit } from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

import { useIntroTiming } from "./board-context"
import { EASE_OUT, HATCH_BASE, revealDelay, rowPresence } from "./timeline-layout"
import { OpenShiftBlock, SuggestionGhost, VisitBlock } from "./visit-block"

/** A pending AI suggestion drawn as a ghost block on the target caregiver's row. */
export type Ghost = {
  id: string
  label: string
  title: string
  description: string
  start: number
  end: number
  index: number
}

/**
 * Name column shared by every timeline row: 30px avatar or swatch, then the label. It sticks to the
 * left edge when the timeline scrolls sideways on narrow screens, above the gridlines and now line.
 */
function RowLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky left-0 z-30 flex h-full min-w-0 items-center gap-[9px] bg-card pl-[11px]",
        className
      )}
    >
      {children}
    </div>
  )
}

function OvertimeDot({ caregiver }: { caregiver: Caregiver }) {
  const { at } = useIntroTiming()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          role="img"
          tabIndex={0}
          aria-label={`Overtime risk: ${caregiver.weeklyHours} of ${caregiver.weeklyLimit} h this week`}
          className="size-1.5 shrink-0 rounded-full bg-warning outline-none focus-visible:ring-[3px] focus-visible:ring-warning/40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 520, damping: 18, delay: at(0.9, 0.1) }}
        />
      </TooltipTrigger>
      <TooltipContent side="right">
        {caregiver.weeklyHours} of {caregiver.weeklyLimit} h this week
      </TooltipContent>
    </Tooltip>
  )
}

/** One caregiver's lane: avatar and name, then their visits and any ghosted suggestions. */
export function TimelineRow({
  caregiver,
  visits,
  ghosts,
  pendingMoves,
  index,
  ref,
}: {
  caregiver: Caregiver
  visits: Visit[]
  ghosts: Ghost[]
  pendingMoves: ReadonlySet<string>
  index: number
  ref?: React.Ref<HTMLDivElement>
}) {
  const { intro, at } = useIntroTiming()

  return (
    <motion.div
      ref={ref}
      role="listitem"
      aria-label={caregiver.name}
      className="grid h-10 shrink-0 grid-cols-[184px_1fr] items-center"
      {...rowPresence(intro, at(0.16 + index * 0.045))}
    >
      <RowLabel>
        <PersonAvatar name={caregiver.name} src={caregiver.avatar} className="size-[30px]" />
        <span className="truncate text-[15px] leading-5">{caregiver.name}</span>
        <AnimatePresence>
          {isOvertimeRisk(caregiver) ? <OvertimeDot key="overtime" caregiver={caregiver} /> : null}
        </AnimatePresence>
      </RowLabel>
      <div className="relative h-full">
        <AnimatePresence>
          {visits.map((visit) => (
            <VisitBlock
              key={visit.id}
              visit={visit}
              delay={at(revealDelay(index, visit.start))}
              pendingMove={pendingMoves.has(visit.id)}
            />
          ))}
          {ghosts.map((ghost) => (
            <SuggestionGhost key={ghost.id} {...ghost} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/** The hatched "Open shifts" lane at the top of the timeline. Its strip is painted by the timeline. */
export function OpenShiftsRow() {
  const { openShifts } = useSchedule()
  const { at } = useIntroTiming()

  return (
    <motion.div
      role="group"
      aria-label="Open shifts"
      className="relative mt-0.5 grid h-11 grid-cols-[184px_1fr] items-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: at(0.12) }}
    >
      <RowLabel className="rounded-l-full bg-panel">
        <span
          aria-hidden
          style={HATCH_BASE}
          className="size-[30px] shrink-0 rounded-full bg-hatched ring-1 ring-hatch/70 ring-inset"
        />
        <span className="truncate text-[15px] leading-5 font-medium">Open shifts</span>
      </RowLabel>
      <div className="relative h-full">
        <AnimatePresence>
          {openShifts.map((shift) => (
            <OpenShiftBlock key={shift.id} shift={shift} delay={at(revealDelay(-1, shift.start))} />
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {openShifts.length === 0 ? (
            <motion.p
              key="all-covered"
              className="absolute inset-y-0 right-3 flex items-center gap-1.5 text-sm text-muted-foreground"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-4" />
              Every shift is covered
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
