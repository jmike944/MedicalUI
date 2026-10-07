"use client"

import * as React from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import { useScheduleData, useScheduleUi } from "@/components/dashboard/schedule-store"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { EASE_OUT } from "@/lib/motion"
import { DAY_END, DAY_START, NOW } from "@/lib/schedule-data"
import { formatHourLabel, hourToPercent, timelineHours } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

import { IntroProvider, useIntroTiming, useSpotlightIs } from "./board-context"
import { CaregiversEmpty } from "./caregivers-empty"
import { NowMarker } from "./now-marker"
import { OptimizeSweep } from "./optimize-sweep"
import { OpenShiftsStrip } from "./row-parts"
import { SuggestionConnectors, useConnectorSpecs } from "./suggestion-connectors"
import { NAME_COL_VARS, ROW_GRID, TRACK_OVERLAY } from "./timeline-layout"
import { OpenShiftsRow, TimelineRow, type Ghost } from "./timeline-row"

/** Every hour boundary from 7 AM to 7 PM, including the closing edge. */
const gridHours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i)

const NO_GHOSTS: readonly Ghost[] = []

function HourLabels() {
  const { at } = useIntroTiming()
  return (
    <div aria-hidden className={cn(ROW_GRID, "mt-[7px] h-6")}>
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
    <div aria-hidden className={cn(TRACK_OVERLAY, "pointer-events-none")}>
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

function TimelineBody() {
  const { visitsByCaregiver, suggestions, visits, openShifts } = useScheduleData()
  const { visibleCaregivers, previewSuggestions, optimizing, highlightedVisitId } = useScheduleUi()
  // Hovering "AI suggestion" in the legend previews the ghosts even before the board shows them.
  const legendPreview = useSpotlightIs("suggestion")
  const showSuggestions = previewSuggestions || legendPreview

  // Ghost blocks keyed by the caregiver who would take the visit, plus the sources they'd move.
  const { ghostsByCaregiver, pendingMoves, pendingFills } = React.useMemo(() => {
    const ghosts = new Map<string, Ghost[]>()
    const moves = new Set<string>()
    const fills = new Set<string>()
    if (!showSuggestions) return { ghostsByCaregiver: ghosts, pendingMoves: moves, pendingFills: fills }
    for (const suggestion of suggestions) {
      const source =
        suggestion.kind === "reassign"
          ? visits.find((v) => v.id === suggestion.visitId)
          : openShifts.find((s) => s.id === suggestion.openShiftId)
      if (!source) continue
      if (suggestion.kind === "reassign") moves.add(suggestion.visitId)
      else fills.add(suggestion.openShiftId)
      const list = ghosts.get(suggestion.toCaregiverId) ?? []
      list.push({
        id: suggestion.id,
        label: "shortLabel" in source ? source.shortLabel : source.patient,
        title: suggestion.title,
        description: suggestion.description,
        start: source.start,
        end: source.end,
      })
      ghosts.set(suggestion.toCaregiverId, list)
    }
    return { ghostsByCaregiver: ghosts, pendingMoves: moves, pendingFills: fills }
  }, [showSuggestions, suggestions, visits, openShifts])

  const connectors = useConnectorSpecs({
    suggestions,
    visits,
    openShifts,
    caregivers: visibleCaregivers,
    enabled: showSuggestions,
  })
  const visitOwners = React.useMemo(
    () => new Map(visits.map((visit) => [visit.id, visit.caregiverId])),
    [visits]
  )

  return (
    <div className="relative mt-[5px] flex flex-col">
      <OpenShiftsStrip />
      <HourGridlines />
      <SuggestionConnectors specs={connectors} visitOwners={visitOwners} />
      <LayoutGroup id="schedule-timeline">
        <OpenShiftsRow pendingFills={pendingFills} />
        <div role="list" aria-label="Caregivers" className="relative mt-2 flex flex-col">
          <AnimatePresence>
            {visibleCaregivers.map((caregiver, index) => (
              <TimelineRow
                key={caregiver.id}
                caregiver={caregiver}
                index={index}
                visits={visitsByCaregiver.get(caregiver.id) ?? []}
                ghosts={ghostsByCaregiver.get(caregiver.id) ?? NO_GHOSTS}
                pendingMoves={pendingMoves}
                highlightedVisitId={highlightedVisitId}
              />
            ))}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {visibleCaregivers.length === 0 ? <CaregiversEmpty key="empty" /> : null}
        </AnimatePresence>
      </LayoutGroup>
      <AnimatePresence>{optimizing ? <OptimizeSweep key="sweep" /> : null}</AnimatePresence>
      <NowMarker />
    </div>
  )
}

/** Where a focus hour should sit in the visible part of the track when the timeline has to scroll. */
const FOCUS_VIEW_RATIO = 0.33

/**
 * On narrow screens the timeline scrolls sideways. Returns a function that glides the track so
 * `hour` sits about a third of the way into the visible lanes (instantly when motion is reduced).
 * With `onlyIfHidden`, it leaves the scroll alone when that hour is already comfortably in view.
 */
function useScrollToHour(rootRef: React.RefObject<HTMLDivElement | null>) {
  return React.useCallback(
    (hour: number, { onlyIfHidden = false } = {}) => {
      const viewport = rootRef.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]")
      const content = rootRef.current?.querySelector<HTMLElement>("[data-timeline-content]")
      if (!viewport || !content) return
      const overflow = viewport.scrollWidth - viewport.clientWidth
      if (overflow <= 1) return
      const nameCol = parseFloat(getComputedStyle(content).getPropertyValue("--name-col")) || 0
      const track = content.offsetWidth - nameCol
      const x = nameCol + (track * hourToPercent(hour)) / 100
      const visible = viewport.clientWidth - nameCol
      const offset = x - nameCol - viewport.scrollLeft
      if (onlyIfHidden && offset > 0 && offset < visible * 0.7) return
      const left = Math.min(overflow, Math.max(0, x - nameCol - visible * FOCUS_VIEW_RATIO))
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      viewport.scrollTo({ left, behavior: reduce ? "auto" : "smooth" })
    },
    [rootRef]
  )
}

/**
 * Keeps the important part of the day in view on narrow screens: NOW when the view opens, and
 * the first AI ghost when the optimizer puts its suggestions on the board.
 */
function useNarrowScrollFocus(rootRef: React.RefObject<HTMLDivElement | null>) {
  const scrollToHour = useScrollToHour(rootRef)
  const { suggestions, visits, openShifts } = useScheduleData()
  const { previewSuggestions } = useScheduleUi()

  React.useEffect(() => {
    // Let the lanes start revealing first, so the glide reads as the board settling on "now".
    const timeout = window.setTimeout(() => scrollToHour(NOW), 450)
    return () => window.clearTimeout(timeout)
  }, [scrollToHour])

  const firstGhostHour = React.useMemo(() => {
    const starts = suggestions.flatMap((suggestion) => {
      const source =
        suggestion.kind === "reassign"
          ? visits.find((v) => v.id === suggestion.visitId)
          : openShifts.find((s) => s.id === suggestion.openShiftId)
      return source ? [source.start] : []
    })
    return starts.length ? Math.min(...starts) : null
  }, [suggestions, visits, openShifts])

  // Runs when the preview turns on, not every time a suggestion is handled.
  const revealFirstGhost = React.useEffectEvent(() => {
    if (firstGhostHour !== null) scrollToHour(firstGhostHour, { onlyIfHidden: true })
  })
  React.useEffect(() => {
    if (previewSuggestions) revealFirstGhost()
  }, [previewSuggestions])
}

/** The day view: hour scale, open shifts lane and one lane per caregiver, with a live "now" line. */
export function DayTimeline() {
  const rootRef = React.useRef<HTMLDivElement>(null)
  useNarrowScrollFocus(rootRef)

  return (
    <IntroProvider>
      {/* Inline-size containment keeps the 980px timeline from widening the page; it scrolls instead. */}
      <ScrollArea ref={rootRef} className="w-full contain-inline-size">
        <div data-timeline-content className={cn(NAME_COL_VARS, "min-w-[980px]")}>
          <HourLabels />
          <TimelineBody />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </IntroProvider>
  )
}
