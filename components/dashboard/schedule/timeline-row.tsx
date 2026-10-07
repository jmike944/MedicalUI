"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion } from "motion/react"

import { useScheduleData } from "@/components/dashboard/schedule-store"
import type { Caregiver, Visit } from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

import { useIntroTiming } from "./board-context"
import { CaregiverLabel, OpenShiftsLabel } from "./row-parts"
import { EASE_OUT, ROW_GRID, revealDelay, rowPresence } from "./timeline-layout"
import { OpenShiftBlock, SuggestionGhost, VisitBlock } from "./visit-block"

/** A pending AI suggestion drawn as a ghost block on the target caregiver's row. */
export type Ghost = {
  id: string
  label: string
  title: string
  description: string
  start: number
  end: number
}

/** One caregiver's lane: avatar and name, then their visits and any ghosted suggestions. */
export function TimelineRow({
  caregiver,
  visits,
  ghosts,
  pendingMoves,
  highlightedVisitId,
  index,
  ref,
}: {
  caregiver: Caregiver
  visits: Visit[]
  ghosts: readonly Ghost[]
  pendingMoves: ReadonlySet<string>
  highlightedVisitId: string | null
  index: number
  ref?: React.Ref<HTMLDivElement>
}) {
  const { intro, at } = useIntroTiming()

  return (
    <motion.div
      ref={ref}
      role="listitem"
      aria-label={caregiver.name}
      className={cn(ROW_GRID, "h-10 shrink-0 items-center")}
      {...rowPresence(intro, at(0.16 + index * 0.045))}
    >
      <CaregiverLabel caregiver={caregiver} />
      <div className="relative h-full">
        <AnimatePresence>
          {visits.map((visit) => (
            <VisitBlock
              key={visit.id}
              visit={visit}
              caregiver={caregiver}
              delay={at(revealDelay(index, visit.start))}
              pendingMove={pendingMoves.has(visit.id)}
              highlighted={highlightedVisitId === visit.id}
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
export function OpenShiftsRow({ pendingFills }: { pendingFills: ReadonlySet<string> }) {
  const { openShifts } = useScheduleData()
  const { at } = useIntroTiming()

  return (
    <motion.div
      role="group"
      aria-label="Open shifts"
      className={cn(ROW_GRID, "relative mt-0.5 h-11 items-center")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: at(0.12) }}
    >
      <OpenShiftsLabel />
      <div className="relative h-full">
        <AnimatePresence>
          {openShifts.map((shift) => (
            <OpenShiftBlock
              key={shift.id}
              shift={shift}
              delay={at(revealDelay(-1, shift.start))}
              pendingMove={pendingFills.has(shift.id)}
            />
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
