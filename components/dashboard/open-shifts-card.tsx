"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, UserAdd01Icon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion, useIsPresent } from "motion/react"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { CardHeading, glanceCardClassName } from "@/components/dashboard/cards/card-heading"
import { describeRequirement } from "@/components/dashboard/cards/copilot-copy"
import { useEntranceTiming } from "@/components/dashboard/cards/use-entrance-timing"
import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { Reveal } from "@/components/dashboard/reveal"
import {
  isOvertimeRisk,
  useScheduleActions,
  useScheduleData,
} from "@/components/dashboard/schedule-store"
import { HatchedCircle } from "@/components/dashboard/shared/hatched-circle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { EASE_IN_EXIT, rise } from "@/lib/motion"
import type { OpenShift } from "@/lib/schedule-data"
import { formatRange } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

const CARD_DELAY = 0.4

export function OpenShiftsCard() {
  const { openShifts } = useScheduleData()
  const titleId = React.useId()
  const entrance = useEntranceTiming(CARD_DELAY + 2)
  const listRef = React.useRef<HTMLDivElement>(null)
  const emptyRef = React.useRef<HTMLDivElement>(null)

  /**
   * Filling a shift removes its row, Fill button and all, so put focus on the row that slid
   * into its place (or the one above, or the empty state) instead of letting it drop to <body>.
   */
  const focusAfterFill = React.useCallback((index: number) => {
    const fills = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>("[data-fill-trigger]") ?? []
    ).filter((el) => !el.closest("[inert]"))
    const target = fills[Math.min(index, fills.length - 1)] ?? emptyRef.current
    target?.focus({ preventScroll: true })
  }, [])

  // min-w-0: the glance grid's fr columns would otherwise widen to fit a long name, which
  // must truncate instead.
  return (
    <Reveal delay={CARD_DELAY} className="h-full min-w-0">
      <Card role="region" aria-labelledby={titleId} className={glanceCardClassName}>
        <CardHeader>
          <CardHeading id={titleId} icon={UserAdd01Icon} delay={CARD_DELAY + 0.15}>
            Open shifts
          </CardHeading>
          <CardAction className="row-span-1 self-center">
            <Badge
              variant="secondary"
              className="h-6 px-[9px] text-[13px] font-normal text-secondary-foreground/80"
            >
              <AnimatedNumber
                value={openShifts.length}
                delay={entrance.at(CARD_DELAY + 0.2)}
                duration={0.6}
              />{" "}
              today
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col">
          <ItemGroup ref={listRef} className="relative gap-3">
            <AnimatePresence mode="popLayout">
              {openShifts.map((shift, index) => (
                <OpenShiftRow
                  key={shift.id}
                  shift={shift}
                  delay={entrance.at(CARD_DELAY + 0.25 + index * 0.08)}
                  onFilled={() => focusAfterFill(index)}
                />
              ))}
            </AnimatePresence>
          </ItemGroup>

          <AnimatePresence>
            {openShifts.length === 0 ? (
              <motion.div
                key="empty"
                ref={emptyRef}
                tabIndex={-1}
                className="flex flex-1 outline-none"
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
                    <EmptyTitle className="text-base">All shifts covered</EmptyTitle>
                    <EmptyDescription>Every visit today has a caregiver.</EmptyDescription>
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

/** One uncovered shift. Inert while it animates out so a stale Fill can't fire. */
function OpenShiftRow({
  shift,
  delay,
  onFilled,
  ref,
}: {
  shift: OpenShift
  delay: number
  onFilled: () => void
  ref?: React.Ref<HTMLDivElement>
}) {
  const isPresent = useIsPresent()

  return (
    <Item
      asChild
      role="listitem"
      className="h-14 flex-nowrap gap-[11px] rounded-[20px] bg-panel py-0 pr-2 pl-2"
    >
      <motion.div
        ref={ref}
        layout
        inert={!isPresent}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { ...rise, delay },
        }}
        // A short, contained exit: the row fades out in place before the next one slides up,
        // instead of sliding across the card's padding.
        exit={{
          opacity: 0,
          x: 16,
          scale: 0.97,
          transition: { duration: 0.22, ease: EASE_IN_EXIT, opacity: { duration: 0.16 } },
        }}
      >
        <ItemMedia className="group-has-data-[slot=item-description]/item:translate-y-0 group-has-data-[slot=item-description]/item:self-center">
          {/* The design's denser 6px hatch; it marches while the row is hovered or focused. */}
          <HatchedCircle march="hover" className="[--hatch-size:6px]" />
        </ItemMedia>
        {/* min-w-0 + truncate: long names and requirements end in an ellipsis before the Fill button. */}
        <ItemContent className="min-w-0 gap-0">
          <ItemTitle className="block max-w-full truncate text-[15px] leading-5 tracking-[-0.02em]">
            {shift.patient}
          </ItemTitle>
          <ItemDescription className="truncate text-sm leading-5">
            {formatRange(shift.start, shift.end)} · {describeRequirement(shift.requirement)}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <FillMenu shift={shift} onFilled={onFilled} />
        </ItemActions>
      </motion.div>
    </Item>
  )
}

/** "Fill" button that lists qualified caregivers who are free for the shift. */
function FillMenu({ shift, onFilled }: { shift: OpenShift; onFilled: () => void }) {
  const { availableCaregiversFor } = useScheduleData()
  const { fillOpenShift } = useScheduleActions()
  const options = availableCaregiversFor(shift)
  const duration = shift.end - shift.start
  // Set when a caregiver is picked: the trigger is about to leave with its row.
  const filled = React.useRef(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/*
          Hover and press scale in CSS, not Motion's whileHover/whileTap: Motion's press gesture
          turns Enter into a synthetic pointerdown, which Radix reads as a second toggle, so the menu
          opened and closed again on Enter. The `scale` property (not transform) springs out on
          hover via an overshooting curve and presses in quickly.
        */}
        <Button
          data-fill-trigger=""
          aria-label={`Fill ${shift.patient}’s shift`}
          className="relative h-9 overflow-hidden rounded-full px-3.5 text-[15px] transition-[background-color,color,box-shadow,scale] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:duration-100 active:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95"
        >
          Fill
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-full -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-primary-foreground/45 to-transparent transition-transform duration-700 ease-out group-hover/button:translate-x-full motion-reduce:hidden"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
        onCloseAutoFocus={(event) => {
          if (!filled.current) return
          filled.current = false
          event.preventDefault()
          onFilled()
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Free {formatRange(shift.start, shift.end)} · {shift.requirement} qualified
          </DropdownMenuLabel>
          {options.length > 0 ? (
            options.map((caregiver) => {
              const after = caregiver.weeklyHours + duration
              const pushesToRisk = isOvertimeRisk({ ...caregiver, weeklyHours: after })
              return (
                <DropdownMenuItem
                  key={caregiver.id}
                  onSelect={() => {
                    filled.current = true
                    fillOpenShift(shift.id, caregiver.id)
                  }}
                >
                  <PersonAvatar name={caregiver.name} src={caregiver.avatar} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{caregiver.name}</span>
                    <span className="text-xs text-muted-foreground">{caregiver.role}</span>
                  </span>
                  <span
                    className={cn(
                      "text-xs text-muted-foreground tabular-nums",
                      pushesToRisk && "text-warning-foreground"
                    )}
                  >
                    {caregiver.weeklyHours} of {caregiver.weeklyLimit} h
                    {pushesToRisk ? <span className="sr-only">, near overtime after this shift</span> : null}
                  </span>
                </DropdownMenuItem>
              )
            })
          ) : (
            <DropdownMenuItem disabled>No qualified caregivers free</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
