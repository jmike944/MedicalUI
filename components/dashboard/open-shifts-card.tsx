"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, UserAdd01Icon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion, useIsPresent } from "motion/react"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { CardHeading, glanceCardClassName } from "@/components/dashboard/cards/card-heading"
import { describeRequirement } from "@/components/dashboard/cards/copilot-copy"
import { HatchedCircle } from "@/components/dashboard/cards/hatched-circle"
import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { Reveal } from "@/components/dashboard/reveal"
import { isOvertimeRisk, useSchedule } from "@/components/dashboard/schedule-store"
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
import type { OpenShift } from "@/lib/schedule-data"
import { formatRange } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

const CARD_DELAY = 0.4

export function OpenShiftsCard() {
  const { openShifts } = useSchedule()
  const titleId = React.useId()

  return (
    <Reveal delay={CARD_DELAY} className="h-full">
      <Card role="region" aria-labelledby={titleId} className={glanceCardClassName}>
        <CardHeader>
          <CardHeading id={titleId} icon={UserAdd01Icon} delay={CARD_DELAY + 0.15}>
            Open shifts
          </CardHeading>
          <CardAction className="row-span-1 self-center">
            <Badge
              variant="secondary"
              className="h-7 px-[9px] text-[13px] font-normal text-secondary-foreground/80"
            >
              <AnimatedNumber value={openShifts.length} delay={CARD_DELAY + 0.2} duration={0.6} /> today
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col">
          <ItemGroup className="relative gap-3">
            <AnimatePresence mode="popLayout">
              {openShifts.map((shift, index) => (
                <OpenShiftRow key={shift.id} shift={shift} index={index} />
              ))}
            </AnimatePresence>
          </ItemGroup>

          <AnimatePresence>
            {openShifts.length === 0 ? (
              <motion.div
                key="empty"
                className="flex flex-1"
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
  index,
  ref,
}: {
  shift: OpenShift
  index: number
  ref?: React.Ref<HTMLDivElement>
}) {
  const isPresent = useIsPresent()

  return (
    <Item
      asChild
      role="listitem"
      className="h-14 flex-nowrap gap-[11px] rounded-[20px] bg-panel py-0 pr-2 pl-2.5"
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
          transition: {
            type: "spring",
            stiffness: 360,
            damping: 28,
            delay: CARD_DELAY + 0.25 + index * 0.08,
          },
        }}
        exit={{
          opacity: 0,
          x: 56,
          scale: 0.96,
          transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
        }}
      >
        <ItemMedia>
          <HatchedCircle />
        </ItemMedia>
        <ItemContent className="min-w-0 gap-0">
          <ItemTitle className="text-[15px] leading-5 tracking-[-0.02em]">{shift.patient}</ItemTitle>
          <ItemDescription className="truncate text-sm leading-5">
            {formatRange(shift.start, shift.end)} · {describeRequirement(shift.requirement)}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <FillMenu shift={shift} />
        </ItemActions>
      </motion.div>
    </Item>
  )
}

/** "Fill" button that lists qualified caregivers who are free for the shift. */
function FillMenu({ shift }: { shift: OpenShift }) {
  const { availableCaregiversFor, fillOpenShift } = useSchedule()
  const options = availableCaregiversFor(shift)
  const duration = shift.end - shift.start

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          asChild
          className="relative h-9 overflow-hidden rounded-full px-3.5 text-[15px]"
          aria-label={`Fill ${shift.patient}’s shift`}
        >
          <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
            Fill
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-full -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-primary-foreground/45 to-transparent transition-transform duration-700 ease-out group-hover/button:translate-x-full motion-reduce:hidden"
            />
          </motion.button>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
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
                  onSelect={() => fillOpenShift(shift.id, caregiver.id)}
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
