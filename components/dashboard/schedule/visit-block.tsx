"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Clock01Icon,
  Location01Icon,
  SparklesIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { useSchedule } from "@/components/dashboard/schedule-store"
import {
  openShiftBlockStyle,
  suggestionBlockStyle,
  visitStatusStyles,
} from "@/components/dashboard/visit-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { openShifts as initialOpenShifts, type OpenShift, type Visit } from "@/lib/schedule-data"
import { formatHours, formatRange, formatTime } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

import { useBoard, useIntro } from "./board-context"
import { CLIP_HIDDEN, CLIP_SHOWN, EASE_OUT, GLIDE, HATCH_BASE, blockPosition } from "./timeline-layout"

/**
 * Visits that started life as an open shift keep its id, so they can shed their hatching on arrival
 * and keep the shift's compact label in narrow blocks.
 */
const openShiftLabels = new Map(initialOpenShifts.map((shift) => [shift.id, shift.shortLabel]))

const blockBase =
  "relative flex size-full items-center overflow-hidden rounded-full pr-1 pl-[7px] text-left text-[13px] font-medium outline-none transition-[box-shadow,filter] duration-200 hover:shadow-sm hover:brightness-[1.02] focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:shadow-sm"

/**
 * Left-to-right clip reveal used on first paint. The reveal is decided once at mount, so later
 * re-renders never replay it, and the clip is dropped afterwards so shadows and focus rings show.
 */
function useReveal(delay: number) {
  const intro = useIntro()
  const reduceMotion = useReducedMotion()
  const [shouldReveal] = React.useState(intro)
  if (!shouldReveal) return { initial: undefined, animate: undefined, transition: undefined }
  return {
    initial: { clipPath: CLIP_HIDDEN },
    animate: { clipPath: CLIP_SHOWN, transitionEnd: { clipPath: "none" } },
    transition: reduceMotion
      ? { duration: 0 }
      : { delay, duration: 0.6, ease: EASE_OUT },
  }
}

const detailItem: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
}

function VisitDetails({ visit }: { visit: Visit }) {
  const { caregiverById } = useSchedule()
  const caregiver = caregiverById(visit.caregiverId)
  const status = visitStatusStyles[visit.status]

  return (
    <motion.div
      className="flex flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } } }}
    >
      <motion.div variants={detailItem} className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-base font-medium">{visit.patient}</p>
          <p className="text-muted-foreground">{visit.service}</p>
        </div>
        <Badge variant={visit.status === "attention" ? "destructive" : "secondary"}>
          <span aria-hidden className={cn("size-1.5 rounded-full", status.dot)} />
          {status.label}
        </Badge>
      </motion.div>
      <Separator />
      <motion.dl variants={detailItem} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <dt className="flex text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-4" />
            <span className="sr-only">Time</span>
          </dt>
          <dd>
            {formatTime(visit.start)} to {formatTime(visit.end)}
            <span className="text-muted-foreground"> · {formatHours(visit.end - visit.start)}</span>
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="flex text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={1.8} className="size-4" />
            <span className="sr-only">Address</span>
          </dt>
          <dd>{visit.address}</dd>
        </div>
      </motion.dl>
      {caregiver ? (
        <motion.div variants={detailItem} className="flex items-center gap-2">
          <PersonAvatar name={caregiver.name} src={caregiver.avatar} size="sm" />
          <span className="font-medium">{caregiver.name}</span>
          <span className="text-muted-foreground">{caregiver.role}</span>
        </motion.div>
      ) : null}
      {visit.status === "attention" && visit.alert ? (
        <motion.p
          variants={detailItem}
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-attention px-3 py-2.5 text-attention-foreground"
        >
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.8} className="mt-px size-4 shrink-0" />
          {visit.alert}
        </motion.p>
      ) : null}
    </motion.div>
  )
}

/** A visit on a caregiver's row. Glides between rows via its layoutId when it is reassigned. */
export function VisitBlock({
  visit,
  delay,
  pendingMove = false,
  ref,
}: {
  visit: Visit
  /** Entrance delay for the first-paint reveal. */
  delay: number
  /** Source of a previewed AI reassignment: drawn dimmed and dashed. */
  pendingMove?: boolean
  ref?: React.Ref<HTMLDivElement>
}) {
  const { highlightedVisitId } = useSchedule()
  const { activeSpotlight } = useBoard()
  const status = visitStatusStyles[visit.status]
  const highlighted = highlightedVisitId === visit.id
  const spotlit = activeSpotlight === null || activeSpotlight === visit.status
  const reveal = useReveal(delay)
  const shortLabel = openShiftLabels.get(visit.id)

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={visit.id}
      className="absolute inset-y-0 my-auto h-8"
      style={blockPosition(visit.start, visit.end)}
      animate={{ opacity: !spotlit ? 0.22 : pendingMove ? 0.5 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ layout: GLIDE, opacity: { duration: 0.25 } }}
    >
      <HoverCard openDelay={150} closeDelay={80}>
        <HoverCardTrigger asChild>
          <motion.button
            type="button"
            aria-label={`${visit.patient}, ${formatTime(visit.start)} to ${formatTime(visit.end)}, ${status.label}`}
            className={cn(
              blockBase,
              status.block,
              pendingMove && "outline-1 outline-offset-1 outline-primary/50 outline-dashed",
              highlighted && "ring-2 ring-primary ring-offset-2 ring-offset-card"
            )}
            initial={reveal.initial}
            animate={{
              ...reveal.animate,
              scale: highlighted ? [1, 1.07, 1] : 1,
            }}
            transition={{
              clipPath: reveal.transition,
              scale: { duration: 0.6, delay: 0.32, times: [0, 0.35, 1], ease: "easeOut" },
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            {visit.status === "in-progress" ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-shimmer"
                style={{ animationDelay: `${(visit.start % 3) * 0.6}s` }}
              >
                <span className="block size-full -skew-x-12 bg-linear-to-r from-transparent via-card/60 to-transparent" />
              </span>
            ) : null}
            {highlighted && shortLabel ? (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 animate-hatch-march bg-hatched"
                style={HATCH_BASE}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
              />
            ) : null}
            <span className="relative truncate">{shortLabel ?? visit.patient}</span>
          </motion.button>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start" sideOffset={8} className="w-76">
          <VisitDetails visit={visit} />
        </HoverCardContent>
      </HoverCard>
    </motion.div>
  )
}

/** A hatched open shift on the "Open shifts" row. Click to assign a free, qualified caregiver. */
export function OpenShiftBlock({
  shift,
  delay,
  ref,
}: {
  shift: OpenShift
  delay: number
  ref?: React.Ref<HTMLDivElement>
}) {
  const { availableCaregiversFor, fillOpenShift } = useSchedule()
  const { activeSpotlight } = useBoard()
  const [open, setOpen] = React.useState(false)
  const reveal = useReveal(delay)
  const spotlit = activeSpotlight === null || activeSpotlight === "open-shift"
  const candidates = availableCaregiversFor(shift).slice(0, 3)

  const assign = (caregiverId: string) => {
    // Let the popover close before the block glides into the caregiver's row.
    setOpen(false)
    window.setTimeout(() => fillOpenShift(shift.id, caregiverId), 140)
  }

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={shift.id}
      className="absolute inset-y-0 my-auto h-8"
      style={blockPosition(shift.start, shift.end)}
      animate={{ opacity: spotlit ? 1 : 0.22 }}
      exit={{ opacity: 0 }}
      transition={{ layout: GLIDE, opacity: { duration: 0.25 } }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <motion.button
            type="button"
            aria-label={`Open shift for ${shift.patient}, ${formatRange(shift.start, shift.end)}, needs ${shift.requirement}. Assign a caregiver`}
            className={cn(blockBase, "animate-hatch-march", openShiftBlockStyle)}
            style={HATCH_BASE}
            initial={reveal.initial}
            animate={reveal.animate}
            transition={{ clipPath: reveal.transition }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative truncate">{shift.shortLabel}</span>
          </motion.button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-80">
          <PopoverHeader>
            <PopoverTitle>{shift.patient}</PopoverTitle>
            <PopoverDescription>
              {formatRange(shift.start, shift.end)} · {shift.service} · Needs {shift.requirement}
            </PopoverDescription>
          </PopoverHeader>
          {candidates.length > 0 ? (
            <ItemGroup className="gap-1" aria-label="Available caregivers">
              {candidates.map((caregiver, index) => (
                <motion.div
                  key={caregiver.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + index * 0.05, duration: 0.3, ease: EASE_OUT }}
                >
                  <Item size="xs" className="rounded-xl px-2 py-1.5 hover:bg-muted/60">
                    <ItemMedia>
                      <PersonAvatar name={caregiver.name} src={caregiver.avatar} size="sm" />
                    </ItemMedia>
                    <ItemContent className="gap-0">
                      <ItemTitle>{caregiver.name}</ItemTitle>
                      <ItemDescription className="text-xs">
                        {caregiver.role} · {caregiver.weeklyHours} of {caregiver.weeklyLimit} h
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button size="sm" onClick={() => assign(caregiver.id)}>
                        <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.8} data-icon="inline-start" />
                        Assign
                      </Button>
                    </ItemActions>
                  </Item>
                </motion.div>
              ))}
            </ItemGroup>
          ) : (
            <p className="text-muted-foreground">No qualified caregivers are free for this shift.</p>
          )}
        </PopoverContent>
      </Popover>
    </motion.div>
  )
}

/** Ghost of a pending AI suggestion, drawn where the visit would land. Opens the suggestions sheet. */
export function SuggestionGhost({
  label,
  title,
  description,
  start,
  end,
  index,
  ref,
}: {
  label: string
  title: string
  description: string
  start: number
  end: number
  index: number
  ref?: React.Ref<HTMLDivElement>
}) {
  const { setSuggestionsOpen } = useSchedule()
  const { activeSpotlight } = useBoard()
  const reduceMotion = useReducedMotion()
  const spotlit = activeSpotlight === null || activeSpotlight === "suggestion"

  return (
    <motion.div
      ref={ref}
      className="absolute inset-y-0 z-10 my-auto h-8"
      style={blockPosition(start, end)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: spotlit ? 1 : 0.22, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        opacity: { delay: 0.15 + index * 0.14, duration: 0.3 },
        scale: { delay: 0.15 + index * 0.14, type: "spring", stiffness: 420, damping: 24 },
      }}
    >
      {/* Sparkle badge on the corner, so short ghosts keep their full label. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -top-1.5 -right-1 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.35 + index * 0.14, type: "spring", stiffness: 520, damping: 18 }}
      >
        <HugeiconsIcon icon={SparklesIcon} strokeWidth={2.2} className="size-2.5" />
      </motion.span>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            aria-label={`AI suggestion: ${title}. Review suggestions`}
            onClick={() => setSuggestionsOpen(true)}
            className={cn(blockBase, "hover:brightness-100", suggestionBlockStyle)}
            animate={reduceMotion ? undefined : { opacity: [1, 0.7, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
            whileHover={{ y: -1, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="truncate">{label}</span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 flex-col items-start gap-0.5">
          <span className="font-medium">{title}</span>
          <span className="text-background/70">{description}</span>
        </TooltipContent>
      </Tooltip>
    </motion.div>
  )
}
