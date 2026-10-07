"use client"

import { AnimatePresence, motion } from "motion/react"

import { useScheduleUi } from "@/components/dashboard/schedule-store"
import { Card, CardContent } from "@/components/ui/card"

import { BoardProvider } from "./schedule/board-context"
import { DayTimeline } from "./schedule/day-timeline"
import { ScheduleLegend } from "./schedule/schedule-legend"
import { ScheduleHeader } from "./schedule/schedule-toolbar"
import { SuggestionBar } from "./schedule/suggestion-bar"
import { EASE_IN_EXIT, EASE_OUT } from "./schedule/timeline-layout"
import { WeekView } from "./schedule/week-view"

const MotionCard = motion.create(Card)

/** The schedule card: today's visits per caregiver on a day timeline, or the week at a glance. */
export function ScheduleBoard() {
  const { view } = useScheduleUi()

  return (
    <BoardProvider>
      <MotionCard
        role="region"
        aria-labelledby="schedule-title"
        className="gap-0 rounded-[2rem] py-0 ring-0"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <ScheduleHeader />
        {/* A size container: the timeline and the suggestion bar adapt to the card, not the window. */}
        <CardContent className="@container relative">
          {/* Day/Week cross-fade: the outgoing view is lifted out of the flow (popLayout) and leaves
              fast while the incoming one starts at once, so the card never shows an empty frame.
              No initial={false}: it would block the first-load entrance of everything inside. */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
              exit={{
                opacity: 0,
                y: -6,
                filter: "blur(4px)",
                transition: { duration: 0.12, ease: EASE_IN_EXIT },
              }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              {view === "day" ? <DayTimeline /> : <WeekView />}
            </motion.div>
          </AnimatePresence>
          <SuggestionBar />
        </CardContent>
        <ScheduleLegend />
      </MotionCard>
    </BoardProvider>
  )
}
