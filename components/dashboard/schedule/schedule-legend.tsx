"use client"

import * as React from "react"
import { motion } from "motion/react"

import { useScheduleData, useScheduleUi } from "@/components/dashboard/schedule-store"
import { visitStatusStyles } from "@/components/dashboard/visit-status"
import { CardFooter } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { useLockedSpotlight, useSpotlightActions, type Spotlight } from "./board-context"

/** Legend swatches are plain filled dots, like the design; the blocks keep their own borders. */
const ENTRIES: { value: Spotlight; label: string; swatch: string; style?: React.CSSProperties }[] = [
  { value: "done", label: visitStatusStyles.done.label, swatch: "bg-done" },
  { value: "in-progress", label: visitStatusStyles["in-progress"].label, swatch: "bg-in-progress" },
  { value: "scheduled", label: visitStatusStyles.scheduled.label, swatch: "bg-scheduled" },
  { value: "attention", label: visitStatusStyles.attention.label, swatch: "bg-attention" },
  {
    // A touch larger than the dots, with fine grey hatching on white, as drawn in the design.
    value: "open-shift",
    label: "Open shift",
    swatch: "size-[13px] ring-1 ring-hatch/60 ring-inset",
    style: {
      backgroundColor: "var(--color-card)",
      backgroundImage:
        "repeating-linear-gradient(135deg, transparent 0 2px, color-mix(in oklab, var(--color-hatch) 70%, transparent) 2px 3px)",
    },
  },
  { value: "suggestion", label: "AI suggestion", swatch: "bg-accent" },
]

/**
 * How many things on the current view each entry would spotlight. Entries with nothing to show
 * stay quiet instead of dimming the whole board.
 */
function useLegendCounts(): Record<Spotlight, number> {
  const { visitsByCaregiver, openShifts, suggestions } = useScheduleData()
  const { view, visibleCaregivers } = useScheduleUi()
  return React.useMemo(() => {
    const counts: Record<Spotlight, number> = {
      done: 0,
      "in-progress": 0,
      scheduled: 0,
      attention: 0,
      "open-shift": openShifts.length,
      // Ghosts only live on the day timeline.
      suggestion: view === "day" ? suggestions.length : 0,
    }
    for (const caregiver of visibleCaregivers) {
      for (const visit of visitsByCaregiver.get(caregiver.id) ?? []) counts[visit.status] += 1
    }
    if (view === "week") {
      // Past days read as done and later days as scheduled; other days always carry open shifts.
      counts.done += visibleCaregivers.length
      counts.scheduled += visibleCaregivers.length
      counts["open-shift"] += 1
    }
    return counts
  }, [view, visibleCaregivers, visitsByCaregiver, openShifts, suggestions])
}

function emptyHint(value: Spotlight, view: "day" | "week") {
  switch (value) {
    case "suggestion":
      return view === "week"
        ? "AI suggestions show on the Day view"
        : "No pending AI suggestions. Run Optimize to look for some."
    case "open-shift":
      return "Every shift is covered"
    default:
      return "Nothing with this status on the board"
  }
}

/**
 * The status legend doubles as a spotlight: hover or focus an entry to preview it on the
 * board, click to keep it highlighted.
 */
export function ScheduleLegend() {
  const spotlight = useLockedSpotlight()
  const { setSpotlight, setPreview } = useSpotlightActions()
  const { view, previewSuggestions } = useScheduleUi()
  const { suggestions } = useScheduleData()
  const counts = useLegendCounts()
  // While suggestions are previewed, the suggestion bar sits on this row in a wide card.
  const covered = previewSuggestions && suggestions.length > 0

  // A locked spotlight that no longer matches anything (e.g. the last open shift was filled) lets go.
  const lockedEmpty = spotlight !== null && counts[spotlight] === 0
  React.useEffect(() => {
    if (lockedEmpty) setSpotlight(null)
  }, [lockedEmpty, setSpotlight])

  return (
    <CardFooter
      data-covered={covered || undefined}
      inert={covered}
      className="mt-2 pb-6 pl-[35px] transition-opacity duration-200 @xl/card:data-covered:opacity-0"
    >
      <ToggleGroup
        type="single"
        value={spotlight ?? ""}
        onValueChange={(value) => {
          const next = (value || null) as Spotlight | null
          if (next && counts[next] === 0) return
          setSpotlight(next)
        }}
        spacing={4.5}
        aria-label="Highlight by status"
        className="flex-wrap gap-y-1"
        onMouseLeave={() => setPreview(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null)
        }}
      >
        {ENTRIES.map((entry, index) => {
          const empty = counts[entry.value] === 0
          const preview = () => setPreview(empty ? null : entry.value)
          const item = (
            <ToggleGroupItem
              value={entry.value}
              aria-disabled={empty || undefined}
              onMouseEnter={preview}
              onFocus={preview}
              className={cn(
                "group/legend -mx-1.5 h-5 min-w-0 gap-[9px] rounded-full px-1.5 text-sm font-normal text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-transparent data-[state=on]:text-foreground",
                empty && "cursor-default hover:text-muted-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2.5 shrink-0 rounded-full transition-[scale,opacity] duration-200",
                  empty
                    ? "opacity-40"
                    : "group-hover/legend:scale-125 group-data-[state=on]/legend:scale-125",
                  entry.swatch
                )}
                style={entry.style}
              />
              {entry.label}
            </ToggleGroupItem>
          )

          return (
            <motion.div
              key={entry.value}
              className="flex"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 + index * 0.05, duration: 0.4, ease: EASE_OUT }}
            >
              {empty ? (
                <Tooltip>
                  <TooltipTrigger asChild>{item}</TooltipTrigger>
                  <TooltipContent side="top">{emptyHint(entry.value, view)}</TooltipContent>
                </Tooltip>
              ) : (
                item
              )}
            </motion.div>
          )
        })}
      </ToggleGroup>
    </CardFooter>
  )
}
