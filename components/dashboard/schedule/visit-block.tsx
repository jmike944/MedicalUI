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
import { useScheduleActions, useScheduleData } from "@/components/dashboard/schedule-store"
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
import {
  DAY_END,
  openShifts as initialOpenShifts,
  type Caregiver,
  type OpenShift,
  type Visit,
} from "@/lib/schedule-data"
import { EASE_OUT, bouncier, glide, pop } from "@/lib/motion"
import { formatHours, formatRange, formatTime } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

import { useIntro, useSpotlit } from "./board-context"
import { CLIP_HIDDEN, CLIP_SHOWN, blockPosition, ghostDelay } from "./timeline-layout"

/**
 * Visits that started life as an open shift keep its id, so they can shed their hatching on arrival
 * and keep the shift's compact label in narrow blocks.
 */
const openShiftLabels = new Map(initialOpenShifts.map((shift) => [shift.id, shift.shortLabel]))

/*
 * Shared block chrome. Focus uses a solid 2px outline with an offset (4.5:1 on the card), drawn as
 * an outline so it never fights the inset rings some statuses use for their border.
 */
const blockBase =
  "relative flex size-full items-center overflow-hidden rounded-full pr-1 pl-[7px] text-left text-[12.5px] font-medium outline-none transition-[box-shadow,filter] duration-200 hover:shadow-sm hover:brightness-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid data-[state=open]:shadow-sm"

/** Dimmed, dashed treatment for the source of a previewed AI move. */
const pendingSource = "outline-1 outline-offset-1 outline-primary/50 outline-dashed"

/** Opacity for a block under the legend spotlight and the AI preview. */
function blockOpacity(spotlit: boolean, pendingMove: boolean) {
  if (!spotlit) return 0.22
  return pendingMove ? 0.5 : 1
}

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

/**
 * When a visit lands (a filled shift or an accepted move), the control the user acted on goes away.
 * If focus fell to the page or is still on the departing copy of this visit, hand it to the new
 * block so keyboard users keep their place. `quiet` is raised while focusing, so the handover
 * doesn't pop the details card open by itself.
 */
function useFocusOnArrival<T extends HTMLElement>(id: string, arrived: boolean) {
  const ref = React.useRef<T>(null)
  const quiet = React.useRef(false)
  React.useEffect(() => {
    if (!arrived) return
    const claim = () => {
      const node = ref.current
      if (!node || !node.isConnected) return
      const active = document.activeElement
      const lost = active === null || active === document.body
      const stale = active instanceof HTMLElement && active !== node && active.dataset.visitId === id
      if (!lost && !stale) return
      quiet.current = true
      node.focus({ preventScroll: true })
      quiet.current = false
    }
    claim()
    // The departing control may still be fading out; check again once exits have finished.
    const timeout = window.setTimeout(claim, 450)
    return () => window.clearTimeout(timeout)
  }, [id, arrived])
  return { ref, quiet }
}

const detailItem: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
}

function VisitDetails({ visit, caregiver }: { visit: Visit; caregiver: Caregiver }) {
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
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} aria-hidden className="size-4" />
            <span className="sr-only">Time</span>
          </dt>
          <dd>
            {formatTime(visit.start)} to {formatTime(visit.end)}
            <span className="text-muted-foreground"> · {formatHours(visit.end - visit.start)}</span>
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="flex text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={1.8} aria-hidden className="size-4" />
            <span className="sr-only">Address</span>
          </dt>
          <dd>{visit.address}</dd>
        </div>
      </motion.dl>
      <motion.div variants={detailItem} className="flex items-center gap-2">
        <PersonAvatar name={caregiver.name} src={caregiver.avatar} size="sm" />
        <span className="font-medium">{caregiver.name}</span>
        <span className="text-muted-foreground">{caregiver.role}</span>
      </motion.div>
      {/* Static detail revealed on demand, so no live region: it shouldn't be re-announced. */}
      {visit.status === "attention" && visit.alert ? (
        <motion.p
          variants={detailItem}
          className="flex items-start gap-2 rounded-xl bg-attention px-3 py-2.5 text-attention-foreground"
        >
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={1.8}
            aria-hidden
            className="mt-px size-4 shrink-0"
          />
          {visit.alert}
        </motion.p>
      ) : null}
    </motion.div>
  )
}

/**
 * A visit on a caregiver's row. Hover, focus, tap or Enter shows its details; it glides between rows
 * via its layoutId when it is reassigned. Memoized: blocks only re-render when their own visit,
 * highlight or preview state changes, and the legend spotlight reaches them through `useSpotlit`.
 */
export const VisitBlock = React.memo(function VisitBlock({
  visit,
  caregiver,
  delay,
  pendingMove = false,
  highlighted = false,
  ref,
}: {
  visit: Visit
  /** The caregiver whose lane this is, for the accessible name and the details card. */
  caregiver: Caregiver
  /** Entrance delay for the first-paint reveal. */
  delay: number
  /** Source of a previewed AI reassignment: drawn dimmed and dashed. */
  pendingMove?: boolean
  /** The visit just moved here: flash it and take focus if the old control vanished. */
  highlighted?: boolean
  ref?: React.Ref<HTMLDivElement>
}) {
  const status = visitStatusStyles[visit.status]
  const spotlit = useSpotlit(visit.status)
  const reveal = useReveal(delay)
  const shortLabel = openShiftLabels.get(visit.id)
  const detailsId = React.useId()
  const [open, setOpen] = React.useState(false)

  const { ref: buttonRef, quiet: quietFocus } = useFocusOnArrival<HTMLButtonElement>(
    visit.id,
    highlighted
  )

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={visit.id}
      layoutDependency={visit.caregiverId}
      className="absolute inset-y-0 my-auto h-8"
      style={blockPosition(visit.start, visit.end)}
      animate={{ opacity: blockOpacity(spotlit, pendingMove) }}
      exit={{ opacity: 0 }}
      transition={{ layout: glide, opacity: { duration: 0.25 } }}
    >
      <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={80}>
        <HoverCardTrigger asChild>
          <motion.button
            ref={buttonRef}
            type="button"
            data-visit-id={visit.id}
            aria-label={`${visit.patient} with ${caregiver.name}, ${formatTime(visit.start)} to ${formatTime(visit.end)}, ${status.label.toLowerCase()}`}
            aria-describedby={detailsId}
            // Hover cards ignore touch and a click alone; tapping or pressing Enter opens the details too.
            onClick={() => setOpen(true)}
            onFocus={(event) => {
              // Skips the hover card's open-on-focus for a programmatic handover.
              if (quietFocus.current) event.preventDefault()
            }}
            className={cn(
              blockBase,
              status.block,
              pendingMove && pendingSource,
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
              // Ambient life on visits in progress: one slow sweep every 9s, then a long rest. Delays
              // keyed to the start time stagger the blocks into a soft wave instead of a unison
              // flash; the fill keeps the sheen parked off the block before its turn. Hidden under
              // reduced motion, where the sweep would end parked on the block.
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-shimmer-ambient [animation-fill-mode:both] motion-reduce:hidden"
                style={{ animationDelay: `${0.8 + (visit.start % 3) * 0.6}s` }}
              >
                <span className="block size-full -skew-x-12 bg-linear-to-r from-transparent via-card/60 to-transparent" />
              </span>
            ) : null}
            {highlighted && shortLabel ? (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 animate-hatch-march bg-hatched [--hatch-size:9px]"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
              />
            ) : null}
            <span className="relative truncate">{shortLabel ?? visit.patient}</span>
          </motion.button>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start" sideOffset={8} className="w-76">
          <VisitDetails visit={visit} caregiver={caregiver} />
        </HoverCardContent>
      </HoverCard>
      {/* The card's content for screen readers, read after the block's name. */}
      <span id={detailsId} hidden>
        {visit.service}, {visit.address}.
        {visit.status === "attention" && visit.alert ? ` ${visit.alert}` : null}
      </span>
    </motion.div>
  )
})

/** A hatched open shift on the "Open shifts" row. Click to assign a free, qualified caregiver. */
export function OpenShiftBlock({
  shift,
  delay,
  pendingMove = false,
  onAssign,
  ref,
}: {
  shift: OpenShift
  delay: number
  /** Source of a previewed AI fill: drawn dimmed and dashed, like a pending move. */
  pendingMove?: boolean
  /**
   * Called as a caregiver is picked, before the shift leaves the row. `fromKeyboard` tells a key
   * press from a click, so whoever moves focus next can match the focus ring to it.
   */
  onAssign?: (shift: OpenShift, fromKeyboard: boolean) => void
  ref?: React.Ref<HTMLDivElement>
}) {
  const { availableCaregiversFor } = useScheduleData()
  const { fillOpenShift } = useScheduleActions()
  const spotlit = useSpotlit("open-shift")
  const [open, setOpen] = React.useState(false)
  const reveal = useReveal(delay)
  const titleId = React.useId()
  const descriptionId = React.useId()
  const candidates = availableCaregiversFor(shift).slice(0, 3)

  const assign = (caregiverId: string, fromKeyboard: boolean) => {
    onAssign?.(shift, fromKeyboard)
    // Let the popover close before the block glides into the caregiver's row. The filled visit
    // takes focus when it lands (useFocusOnArrival); the row catches it if the lane is hidden.
    setOpen(false)
    window.setTimeout(() => fillOpenShift(shift.id, caregiverId), 140)
  }

  return (
    // No `layout`: the block is absolutely placed and never reflows. The hand-off to the filled
    // visit runs through the shared layoutId, and the constant dependency skips re-measuring it.
    // It sits 10px into the 44px lane, a touch below centre, as in the design.
    <motion.div
      ref={ref}
      layoutId={shift.id}
      layoutDependency={shift.id}
      className="absolute top-2.5 h-8"
      style={blockPosition(shift.start, shift.end)}
      animate={{ opacity: blockOpacity(spotlit, pendingMove) }}
      exit={{ opacity: 0 }}
      transition={{ layout: glide, opacity: { duration: 0.25 } }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <motion.button
            type="button"
            data-visit-id={shift.id}
            aria-label={`Open shift for ${shift.patient}, ${formatRange(shift.start, shift.end)}, needs ${shift.requirement}. Assign a caregiver`}
            // The stripes march only while the shift is hovered, focused or being assigned. The
            // design hatches open shifts on a 9px tile, a little looser than the default 8px.
            className={cn(
              blockBase,
              "[--hatch-size:9px] hover:animate-hatch-march focus-visible:animate-hatch-march data-[state=open]:animate-hatch-march",
              openShiftBlockStyle,
              pendingMove && pendingSource
            )}
            initial={reveal.initial}
            animate={reveal.animate}
            transition={{ clipPath: reveal.transition }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative truncate">{shift.shortLabel}</span>
          </motion.button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="w-80"
        >
          <PopoverHeader>
            <PopoverTitle id={titleId}>
              <span className="sr-only">Open shift for </span>
              {shift.patient}
            </PopoverTitle>
            <PopoverDescription id={descriptionId}>
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
                      <Button
                        size="sm"
                        aria-label={`Assign ${caregiver.name}`}
                        // A click with no pointer behind it (detail 0) came from Enter or Space.
                        onClick={(event) => assign(caregiver.id, event.detail === 0)}
                      >
                        <HugeiconsIcon
                          icon={UserAdd01Icon}
                          strokeWidth={1.8}
                          aria-hidden
                          data-icon="inline-start"
                        />
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

/**
 * Ghost of a pending AI suggestion, drawn where the visit would land. Opens the suggestions sheet.
 * Ghosts materialize left to right, in the wake of the optimizer's sweep.
 */
export function SuggestionGhost({
  label,
  title,
  description,
  start,
  end,
  ref,
}: {
  label: string
  title: string
  description: string
  start: number
  end: number
  ref?: React.Ref<HTMLDivElement>
}) {
  const { setSuggestionsOpen } = useScheduleActions()
  const spotlit = useSpotlit("suggestion")
  const reduceMotion = useReducedMotion()
  const delay = ghostDelay(start)

  return (
    <motion.div
      ref={ref}
      className="absolute inset-y-0 z-10 my-auto h-8"
      style={blockPosition(start, end)}
      initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
      animate={{ opacity: spotlit ? 1 : 0.22, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        opacity: { delay, duration: 0.3 },
        filter: { delay, duration: 0.35 },
        scale: { ...pop, delay },
      }}
    >
      {/* Sparkle badge on the corner, so short ghosts keep their full label. At the end of the
          day it tucks in, so it never pokes past the track and makes the timeline scroll. */}
      <motion.span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm",
          end >= DAY_END ? "-right-0.5" : "-right-1"
        )}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...bouncier, delay: delay + 0.2 }}
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
            // Two soft breaths to draw the eye, then it holds still.
            animate={reduceMotion ? undefined : { opacity: [1, 0.7, 1] }}
            transition={{ duration: 2.4, repeat: 1, ease: "easeInOut", delay: delay + 0.4 }}
            whileHover={{ y: -1, opacity: 1, transition: { duration: 0.15 } }}
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
