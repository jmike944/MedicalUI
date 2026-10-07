"use client"

import { motion } from "motion/react"

import { visitStatusStyles } from "@/components/dashboard/visit-status"
import { CardFooter } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import { useBoard, type Spotlight } from "./board-context"
import { EASE_OUT, HATCH_BASE } from "./timeline-layout"

const ENTRIES: { value: Spotlight; label: string; swatch: string; style?: React.CSSProperties }[] = [
  { value: "done", label: visitStatusStyles.done.label, swatch: visitStatusStyles.done.dot },
  {
    value: "in-progress",
    label: visitStatusStyles["in-progress"].label,
    swatch: visitStatusStyles["in-progress"].dot,
  },
  {
    value: "scheduled",
    label: visitStatusStyles.scheduled.label,
    swatch: visitStatusStyles.scheduled.dot,
  },
  {
    value: "attention",
    label: visitStatusStyles.attention.label,
    swatch: visitStatusStyles.attention.dot,
  },
  {
    value: "open-shift",
    label: "Open shift",
    swatch: "bg-hatched bg-size-[6px_6px] ring-1 ring-hatch/70 ring-inset",
    style: HATCH_BASE,
  },
  {
    value: "suggestion",
    label: "AI suggestion",
    swatch: "border border-dashed border-primary/30 bg-accent",
  },
]

/**
 * The status legend doubles as a spotlight: hover or focus an entry to preview it on the
 * timeline, click to keep it highlighted.
 */
export function ScheduleLegend() {
  const { spotlight, setSpotlight, setPreview } = useBoard()

  return (
    <CardFooter className="mt-2 pb-6 pl-[35px]">
      <ToggleGroup
        type="single"
        value={spotlight ?? ""}
        onValueChange={(value) => setSpotlight((value || null) as Spotlight | null)}
        spacing={4.5}
        aria-label="Highlight visits by status"
        className="flex-wrap gap-y-1"
        onMouseLeave={() => setPreview(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null)
        }}
      >
        {ENTRIES.map((entry, index) => (
          <motion.div
            key={entry.value}
            className="flex"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 + index * 0.05, duration: 0.4, ease: EASE_OUT }}
          >
            <ToggleGroupItem
              value={entry.value}
              onMouseEnter={() => setPreview(entry.value)}
              onFocus={() => setPreview(entry.value)}
              className={cn(
                "group/legend -mx-1.5 h-5 min-w-0 gap-[9px] rounded-full px-1.5 text-sm font-normal text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground data-[state=on]:bg-transparent data-[state=on]:text-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2.5 shrink-0 rounded-full transition-transform duration-200 group-hover/legend:scale-125 group-data-[state=on]/legend:scale-125",
                  entry.swatch
                )}
                style={entry.style}
              />
              {entry.label}
            </ToggleGroupItem>
          </motion.div>
        ))}
      </ToggleGroup>
    </CardFooter>
  )
}
