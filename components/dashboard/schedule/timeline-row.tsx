"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion } from "motion/react"

import { useScheduleData } from "@/components/dashboard/schedule-store"
import { EASE_OUT } from "@/lib/motion"
import type { Caregiver, OpenShift, Visit } from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

import { useIntroTiming } from "./board-context"
import { CaregiverLabel, OpenShiftsLabel } from "./row-parts"
import { ROW_GRID, revealDelay, rowPresence } from "./timeline-layout"
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

/**
 * After a shift is assigned from its popover, its visit normally lands in the caregiver's lane and
 * takes focus there. When that lane is filtered out, nothing claims it and focus would fall to the
 * page as the shift leaves, so the row keeps it: the next open shift along the day (or the one
 * before it), else the lane itself.
 */
function useAssignFocusHandoff(openShifts: readonly OpenShift[]) {
  const rowRef = React.useRef<HTMLDivElement>(null)
  const pending = React.useRef<{ id: string; start: number; focusVisible: boolean } | null>(null)

  const onAssign = React.useCallback((shift: OpenShift, fromKeyboard: boolean) => {
    pending.current = { id: shift.id, start: shift.start, focusVisible: fromKeyboard }
  }, [])

  /**
   * Runs once the assigned shift has finished its exit, just before it is removed. Focus may still
   * sit on its departing chip (Radix returned it there on close), so that counts as lost too; the
   * filled visit carries the same id but lives in a caregiver lane, outside this row.
   */
  const onExitComplete = () => {
    const handoff = pending.current
    pending.current = null
    const row = rowRef.current
    if (!handoff || !row) return
    const active = document.activeElement
    const departing =
      active instanceof HTMLElement && row.contains(active) && active.dataset.visitId === handoff.id
    if (active && active !== document.body && !departing) return
    const byStart = openShifts
      .filter((shift) => shift.id !== handoff.id)
      .sort((a, b) => a.start - b.start)
    const next = byStart.find((shift) => shift.start >= handoff.start) ?? byStart.at(-1)
    const target = next
      ? row.querySelector<HTMLElement>(`button[data-visit-id="${next.id}"]`)
      : row
    target?.focus({ preventScroll: true, focusVisible: handoff.focusVisible })
  }

  return { rowRef, onAssign, onExitComplete }
}

/** The hatched "Open shifts" lane at the top of the timeline. Its strip is painted by the timeline. */
export function OpenShiftsRow({ pendingFills }: { pendingFills: ReadonlySet<string> }) {
  const { openShifts } = useScheduleData()
  const { at } = useIntroTiming()
  const { rowRef, onAssign, onExitComplete } = useAssignFocusHandoff(openShifts)

  return (
    <motion.div
      ref={rowRef}
      role="group"
      aria-label="Open shifts"
      // Focusable only from script (the hand-off above); the ring traces the lavender strip.
      tabIndex={-1}
      className={cn(
        ROW_GRID,
        "relative mt-0.5 h-11 items-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: at(0.12) }}
    >
      <OpenShiftsLabel />
      <div className="relative h-full">
        <AnimatePresence onExitComplete={onExitComplete}>
          {openShifts.map((shift) => (
            <OpenShiftBlock
              key={shift.id}
              shift={shift}
              delay={at(revealDelay(-1, shift.start))}
              pendingMove={pendingFills.has(shift.id)}
              onAssign={onAssign}
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
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={1.8}
                aria-hidden
                className="size-4"
              />
              Every shift is covered
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
