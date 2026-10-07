"use client"

import * as React from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import { useSchedule } from "@/components/dashboard/schedule-store"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { DAY_END, DAY_START } from "@/lib/schedule-data"
import { formatHourLabel, hourToPercent, timelineHours } from "@/lib/schedule-time"

import { IntroProvider, useIntroTiming } from "./board-context"
import { CaregiversEmpty } from "./caregivers-empty"
import { NowMarker } from "./now-marker"
import { EASE_OUT } from "./timeline-layout"
import { OpenShiftsRow, TimelineRow, type Ghost } from "./timeline-row"

/** Every hour boundary from 7 AM to 7 PM, including the closing edge. */
const gridHours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i)

function HourLabels() {
  const { at } = useIntroTiming()
  return (
    <div aria-hidden className="mt-[7px] grid h-6 grid-cols-[184px_1fr]">
      <span className="sticky left-0 z-30 bg-card" />
      <div className="relative">
        {timelineHours.map((hour, i) => (
          <motion.span
            key={hour}
            className="absolute inset-y-0 flex items-center pl-1.5 text-[13px] whitespace-nowrap text-muted-foreground"
            style={{ left: `${hourToPercent(hour)}%` }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: at(0.08 + i * 0.03), duration: 0.4, ease: EASE_OUT }}
          >
            {formatHourLabel(hour)}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

function HourGridlines() {
  const { at } = useIntroTiming()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-[184px]">
      {gridHours.map((hour, i) => (
        <motion.span
          key={hour}
          className="absolute inset-y-0 w-px origin-top bg-hatch/25"
          style={{ left: hour === DAY_END ? "calc(100% - 1px)" : `${hourToPercent(hour)}%` }}
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: at(0.08 + i * 0.03), duration: 0.6, ease: EASE_OUT }}
        />
      ))}
    </div>
  )
}

/** The lavender band behind the "Open shifts" row, painted under the gridlines like the design. */
function OpenShiftsStrip() {
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

function TimelineBody() {
  const {
    visibleCaregivers,
    visitsByCaregiver,
    suggestions,
    previewSuggestions,
    visits,
    openShifts,
  } = useSchedule()

  // Ghost blocks for pending suggestions, keyed by the caregiver who would take the visit.
  const { ghostsByCaregiver, pendingMoves } = React.useMemo(() => {
    const ghosts = new Map<string, Ghost[]>()
    const moves = new Set<string>()
    if (!previewSuggestions) return { ghostsByCaregiver: ghosts, pendingMoves: moves }
    suggestions.forEach((suggestion, index) => {
      const source =
        suggestion.kind === "reassign"
          ? visits.find((v) => v.id === suggestion.visitId)
          : openShifts.find((s) => s.id === suggestion.openShiftId)
      if (!source) return
      if (suggestion.kind === "reassign") moves.add(suggestion.visitId)
      const list = ghosts.get(suggestion.toCaregiverId) ?? []
      list.push({
        id: suggestion.id,
        label: "shortLabel" in source ? source.shortLabel : source.patient,
        title: suggestion.title,
        description: suggestion.description,
        start: source.start,
        end: source.end,
        index,
      })
      ghosts.set(suggestion.toCaregiverId, list)
    })
    return { ghostsByCaregiver: ghosts, pendingMoves: moves }
  }, [previewSuggestions, suggestions, visits, openShifts])

  return (
    <div className="relative mt-[5px] flex flex-col">
      <OpenShiftsStrip />
      <HourGridlines />
      <LayoutGroup id="schedule-timeline">
        <OpenShiftsRow />
        <div role="list" aria-label="Caregivers" className="relative mt-2 flex flex-col">
          <AnimatePresence>
            {visibleCaregivers.map((caregiver, index) => (
              <TimelineRow
                key={caregiver.id}
                caregiver={caregiver}
                index={index}
                visits={visitsByCaregiver.get(caregiver.id) ?? []}
                ghosts={ghostsByCaregiver.get(caregiver.id) ?? []}
                pendingMoves={pendingMoves}
              />
            ))}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {visibleCaregivers.length === 0 ? <CaregiversEmpty key="empty" /> : null}
        </AnimatePresence>
      </LayoutGroup>
      <NowMarker />
    </div>
  )
}

/** The day view: hour scale, open shifts lane and one lane per caregiver, with a live "now" line. */
export function DayTimeline() {
  return (
    <IntroProvider>
      {/* Inline-size containment keeps the 980px timeline from widening the page; it scrolls instead. */}
      <ScrollArea className="w-full contain-inline-size">
        <div className="min-w-[980px]">
          <HourLabels />
          <TimelineBody />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </IntroProvider>
  )
}
