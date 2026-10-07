"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Calendar03Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import {
  isOvertimeRisk,
  useScheduleActions,
  useScheduleData,
  useScheduleUi,
  type CaregiverFilter,
  type ScheduleView,
} from "@/components/dashboard/schedule-store"
import { Button } from "@/components/ui/button"
import { CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AGENCY, openShifts as initialOpenShifts } from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

import { EASE_OUT, SLIDE, SNAPPY } from "./timeline-layout"

const VIEWS: { value: ScheduleView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
]

const FILTERS: { value: CaregiverFilter; label: string }[] = [
  { value: "all", label: "All caregivers" },
  { value: "on-shift", label: "On shift now" },
  { value: "overtime", label: "Overtime risk" },
]

function ViewToggle() {
  const { view } = useScheduleUi()
  const { setView } = useScheduleActions()

  return (
    <motion.div layout="position" transition={SLIDE}>
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => {
          if (value) setView(value as ScheduleView)
        }}
        spacing={0}
        aria-label="Schedule view"
        className="h-10 rounded-full bg-panel p-1"
      >
        {VIEWS.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            // `rounded-full!` beats the primitive's first:/last: corner radii, which otherwise mix
            // with the full radius and square off the focus ring's outer corners.
            className="relative h-8 rounded-full! px-[13px] text-sm font-medium text-foreground/70 transition-[color,scale] duration-200 group-data-[spacing=0]/toggle-group:px-[13px] hover:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] data-[state=on]:bg-transparent data-[state=on]:text-foreground"
          >
            {view === option.value ? (
              <motion.span
                layoutId="schedule-view-pill"
                aria-hidden
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                style={{ borderRadius: 999 }}
                transition={SNAPPY}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </motion.div>
  )
}

/**
 * Radix hands focus back to a menu's trigger when it closes. After a pointer pick that would leave
 * the keyboard focus ring on the trigger until the next click, so keep the focus but skip the ring;
 * menus closed from the keyboard still show it.
 */
function usePointerAwareMenuFocus<T extends HTMLElement>() {
  const triggerRef = React.useRef<T>(null)
  const viaPointer = React.useRef(false)
  const contentProps = {
    onPointerDown: () => {
      viaPointer.current = true
    },
    onPointerDownOutside: () => {
      viaPointer.current = true
    },
    onKeyDown: () => {
      viaPointer.current = false
    },
    onCloseAutoFocus: (event: Event) => {
      if (!viaPointer.current) return
      viaPointer.current = false
      event.preventDefault()
      triggerRef.current?.focus({ preventScroll: true, focusVisible: false })
    },
  }
  return { triggerRef, contentProps }
}

function CaregiverFilterMenu() {
  const { filter } = useScheduleUi()
  const { caregivers } = useScheduleData()
  const { setFilter } = useScheduleActions()
  const current = FILTERS.find((option) => option.value === filter) ?? FILTERS[0]
  const { triggerRef, contentProps } = usePointerAwareMenuFocus<HTMLButtonElement>()
  const counts: Record<CaregiverFilter, number> = {
    all: caregivers.length,
    "on-shift": caregivers.filter((c) => c.onShift).length,
    overtime: caregivers.filter(isOvertimeRisk).length,
  }

  return (
    <motion.div layout="position" transition={SLIDE}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="secondary"
            aria-label={`Caregiver filter: ${current.label}`}
            className="relative h-[34px] gap-1.5 overflow-hidden rounded-full pr-2.5 pl-3.5 text-sm font-medium active:scale-[0.98]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={current.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
              >
                {current.label}
              </motion.span>
            </AnimatePresence>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              data-icon="inline-end"
              className="transition-transform duration-200 group-data-[state=open]/button:rotate-180"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" {...contentProps}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Show on the schedule</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={filter}
            onValueChange={(value) => setFilter(value as CaregiverFilter)}
          >
            {FILTERS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
                <DropdownMenuShortcut className="tracking-normal tabular-nums">
                  {counts[option.value]}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

function OptimizeButton() {
  const { optimizing } = useScheduleUi()
  const { optimize } = useScheduleActions()

  return (
    <>
      <Button
        asChild
        size="lg"
        className="relative h-[34px] gap-1.5 overflow-hidden rounded-full px-[13px] text-sm font-medium has-data-[icon=inline-start]:pl-[13px] aria-disabled:cursor-progress"
      >
        {/* aria-disabled rather than disabled keeps keyboard focus on the button during the run;
            optimize() ignores repeat presses while it is busy. */}
        <motion.button
          type="button"
          data-schedule-optimize
          layout
          onClick={optimize}
          aria-disabled={optimizing}
          style={{ borderRadius: 17 }}
          transition={{ layout: SLIDE }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span layout="position" className="flex" transition={{ layout: SLIDE }}>
            <HugeiconsIcon
              icon={SparklesIcon}
              strokeWidth={1.8}
              data-icon="inline-start"
              className={cn(optimizing && "animate-spin")}
            />
          </motion.span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={optimizing ? "running" : "idle"}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: EASE_OUT, layout: SLIDE }}
            >
              {optimizing ? "Optimizing…" : "Optimize"}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence>
            {optimizing ? (
              <motion.span
                key="shimmer"
                aria-hidden
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="absolute inset-y-0 left-0 w-1/2 animate-shimmer [animation-duration:1.4s]">
                  <span className="block size-full -skew-x-12 bg-linear-to-r from-transparent via-primary-foreground/35 to-transparent" />
                </span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.button>
      </Button>
      <span className="sr-only" aria-live="polite">
        {optimizing ? "Optimizing the schedule" : ""}
      </span>
    </>
  )
}

/** Card header: title with the agency's visit count, then the view toggle, filter and optimizer. */
export function ScheduleHeader() {
  const { openShifts } = useScheduleData()
  // Each open shift filled today adds a visit to the agency's total.
  const filledToday = initialOpenShifts.length - openShifts.length

  return (
    <CardHeader className="flex flex-wrap items-center gap-x-3 gap-y-3 pt-5">
      <motion.div
        className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-panel text-foreground">
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} className="size-4" />
        </span>
        <CardTitle id="schedule-title" role="heading" aria-level={2} className="text-xl leading-7 font-normal">
          Schedule
        </CardTitle>
        <CardDescription className="truncate text-[15px] leading-5">
          {AGENCY.dateLabel} ·{" "}
          <AnimatedNumber value={AGENCY.totalVisits + filledToday} duration={1.1} delay={0.15} /> visits
        </CardDescription>
      </motion.div>
      <CardAction className="ml-auto self-center">
        <motion.div
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 }}
        >
          <LayoutGroup id="schedule-toolbar">
            <ViewToggle />
            <CaregiverFilterMenu />
            <OptimizeButton />
          </LayoutGroup>
        </motion.div>
      </CardAction>
    </CardHeader>
  )
}
