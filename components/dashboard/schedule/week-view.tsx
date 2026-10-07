"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { isOvertimeRisk, useSchedule } from "@/components/dashboard/schedule-store"
import { openShiftBlockStyle, visitStatusStyles } from "@/components/dashboard/visit-status"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Caregiver } from "@/lib/schedule-data"
import { formatHours } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

import { IntroProvider, useIntroTiming } from "./board-context"
import { CaregiversEmpty } from "./caregivers-empty"
import { EASE_OUT, HATCH_BASE, rowPresence } from "./timeline-layout"

type WeekDay = { short: string; date: string; full: string; weekend?: boolean }

/** The week of Sep 28. Wednesday (index 2) is today and uses live data from the store. */
const WEEK: WeekDay[] = [
  { short: "Mon", date: "28", full: "Monday, Sep 28" },
  { short: "Tue", date: "29", full: "Tuesday, Sep 29" },
  { short: "Wed", date: "30", full: "Wednesday, Sep 30" },
  { short: "Thu", date: "1", full: "Thursday, Oct 1" },
  { short: "Fri", date: "2", full: "Friday, Oct 2" },
  { short: "Sat", date: "3", full: "Saturday, Oct 3", weekend: true },
  { short: "Sun", date: "4", full: "Sunday, Oct 4", weekend: true },
]
const TODAY = 2
const VISIT_HOURS = 1.5

/** Deterministic visit counts for the days the mock data doesn't cover; weekends run lighter. */
function plannedVisits(caregiverIndex: number, day: number) {
  if (WEEK[day].weekend) return (caregiverIndex + day) % 3
  return ((caregiverIndex * 5 + day * 3) % 4) + 1
}

function plannedOpenShifts(day: number) {
  return WEEK[day].weekend ? day % 2 : (day * 2 + 1) % 3
}

const GRID = "grid grid-cols-[184px_repeat(7,minmax(0,1fr))]"

function DayCell({
  visits,
  hours,
  day,
  delay,
  caregiver,
}: {
  visits: number
  hours: number
  day: number
  delay: number
  caregiver: Caregiver
}) {
  const { setView } = useSchedule()
  const isToday = day === TODAY
  const label = `${caregiver.name}, ${WEEK[day].full}: ${
    visits === 0 ? "day off" : `${visits} ${visits === 1 ? "visit" : "visits"}, ${formatHours(hours)}`
  }`

  if (visits === 0) {
    return (
      <div role="cell" aria-label={label} className="flex h-full items-center justify-center text-[13px] text-muted-foreground/60">
        Off
      </div>
    )
  }

  const pill = cn(
    "relative mx-0.5 flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-full px-2.5 text-[13px]",
    day < TODAY ? visitStatusStyles.done.block : visitStatusStyles.scheduled.block,
    isToday && "font-medium ring-1 ring-primary/25 ring-inset"
  )
  const content = (
    <>
      <span className="truncate">
        {visits} {visits === 1 ? "visit" : "visits"}
      </span>
      <span className="shrink-0 font-normal text-muted-foreground tabular-nums">{formatHours(hours)}</span>
    </>
  )

  return (
    <div role="cell" className="flex h-full items-center">
      {isToday ? (
        <motion.button
          type="button"
          aria-label={`${label}. Open day view`}
          onClick={() => setView("day")}
          className={cn(pill, "outline-none hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50")}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, type: "spring", stiffness: 420, damping: 28 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {content}
        </motion.button>
      ) : (
        <motion.div
          aria-label={label}
          className={pill}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, type: "spring", stiffness: 420, damping: 28 }}
        >
          {content}
        </motion.div>
      )}
    </div>
  )
}

function WeekRow({
  caregiver,
  caregiverIndex,
  rowIndex,
  todayVisits,
  todayHours,
  ref,
}: {
  caregiver: Caregiver
  caregiverIndex: number
  rowIndex: number
  todayVisits: number
  todayHours: number
  ref?: React.Ref<HTMLDivElement>
}) {
  const { intro, at } = useIntroTiming()
  return (
    <motion.div
      ref={ref}
      role="row"
      className={cn(GRID, "h-10 shrink-0 items-center")}
      {...rowPresence(intro, at(0.08 + rowIndex * 0.035))}
    >
      <div
        role="rowheader"
        className="sticky left-0 z-30 flex h-full min-w-0 items-center gap-[9px] bg-card pl-[11px]"
      >
        <PersonAvatar name={caregiver.name} src={caregiver.avatar} className="size-[30px]" />
        <span className="truncate text-[15px] leading-5">{caregiver.name}</span>
        {isOvertimeRisk(caregiver) ? (
          <span role="img" aria-label="Overtime risk" className="ml-px size-1.5 shrink-0 rounded-full bg-warning" />
        ) : null}
      </div>
      {WEEK.map((_, day) => {
        const visits = day === TODAY ? todayVisits : plannedVisits(caregiverIndex, day)
        const hours = day === TODAY ? todayHours : visits * VISIT_HOURS
        return (
          <DayCell
            key={day}
            day={day}
            visits={visits}
            hours={hours}
            caregiver={caregiver}
            delay={at(0.14 + rowIndex * 0.035 + day * 0.03, 0.1 + day * 0.03)}
          />
        )
      })}
    </motion.div>
  )
}

function WeekGrid() {
  const { at } = useIntroTiming()
  const { caregivers, visibleCaregivers, visitsByCaregiver, openShifts } = useSchedule()

  return (
    <ScrollArea className="w-full contain-inline-size">
      <div role="table" aria-label="Week of Sep 28" className="relative min-w-[980px]">
        {/* Today's column highlight, under everything else. */}
        <div aria-hidden className={cn(GRID, "pointer-events-none absolute inset-0 mt-[3px]")}>
          <motion.div
            className="col-start-4 mx-0.5 origin-top rounded-2xl bg-accent/50"
            initial={{ opacity: 0, scaleY: 0.9 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          />
        </div>

        <div role="row" className={cn(GRID, "relative mt-[7px] h-6")}>
          <div role="columnheader">
            <span className="sr-only">Caregiver</span>
          </div>
          {WEEK.map((day, index) => (
            <motion.div
              key={day.full}
              role="columnheader"
              aria-label={day.full}
              className={cn(
                "flex items-center justify-center gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground",
                index === TODAY && "font-medium text-primary"
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: at(0.04 + index * 0.03), duration: 0.35, ease: EASE_OUT }}
            >
              {day.short} {day.date}
              {index === TODAY ? <Badge className="h-4 px-1.5 text-[10px]">Today</Badge> : null}
            </motion.div>
          ))}
        </div>

        <div className="relative mt-[5px] flex flex-col">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0.5 h-11 rounded-full bg-panel" />
          <div role="row" className={cn(GRID, "relative mt-0.5 h-11 items-center")}>
            <div
              role="rowheader"
              className="sticky left-0 z-30 flex h-full min-w-0 items-center gap-[9px] rounded-l-full bg-panel pl-[11px]"
            >
              <span
                aria-hidden
                style={HATCH_BASE}
                className="size-[30px] shrink-0 rounded-full bg-hatched ring-1 ring-hatch/70 ring-inset"
              />
              <span className="truncate text-[15px] leading-5 font-medium">Open shifts</span>
            </div>
            {WEEK.map((day, index) => {
              const count = index === TODAY ? openShifts.length : plannedOpenShifts(index)
              return (
                <div key={day.full} role="cell" className="flex h-full items-center">
                  {count > 0 ? (
                    <motion.span
                      className={cn(
                        "mx-0.5 flex h-8 w-full items-center justify-center rounded-full text-[13px] animate-hatch-march",
                        openShiftBlockStyle
                      )}
                      style={HATCH_BASE}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: at(0.1 + index * 0.03), type: "spring", stiffness: 420, damping: 28 }}
                    >
                      {count} open
                    </motion.span>
                  ) : (
                    <span className="sr-only">No open shifts</span>
                  )}
                </div>
              )
            })}
          </div>

          <div role="rowgroup" className="relative mt-2 flex flex-col">
            <AnimatePresence>
              {visibleCaregivers.map((caregiver, rowIndex) => {
                const today = visitsByCaregiver.get(caregiver.id) ?? []
                return (
                  <WeekRow
                    key={caregiver.id}
                    caregiver={caregiver}
                    caregiverIndex={caregivers.findIndex((c) => c.id === caregiver.id)}
                    rowIndex={rowIndex}
                    todayVisits={today.length}
                    todayHours={today.reduce((sum, v) => sum + (v.end - v.start), 0)}
                  />
                )
              })}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {visibleCaregivers.length === 0 ? <CaregiversEmpty key="empty" /> : null}
          </AnimatePresence>
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

/** The week view: one pill per caregiver per day, with today's column drawn from live data. */
export function WeekView() {
  return (
    <IntroProvider>
      <WeekGrid />
    </IntroProvider>
  )
}
