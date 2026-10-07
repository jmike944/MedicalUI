import type { VisitStatus } from "@/lib/schedule-data"

/** Label and block styling for each visit status. Shared by the timeline, its legend and hover cards. */
export const visitStatusStyles: Record<
  VisitStatus,
  { label: string; block: string; dot: string }
> = {
  done: {
    label: "Done",
    block: "bg-done text-done-foreground",
    dot: "bg-done ring-1 ring-inset ring-hatch/60",
  },
  "in-progress": {
    label: "In progress",
    block: "bg-in-progress text-in-progress-foreground font-medium",
    dot: "bg-in-progress",
  },
  scheduled: {
    label: "Scheduled",
    block: "bg-scheduled text-scheduled-foreground",
    dot: "bg-scheduled ring-1 ring-inset ring-hatch/60",
  },
  attention: {
    label: "Needs attention",
    block: "bg-attention text-attention-foreground ring-1 ring-inset ring-attention-border",
    dot: "bg-attention ring-1 ring-inset ring-attention-border",
  },
}

/** Ghost style for AI-suggested placements; matches the legend's "AI suggestion" swatch. */
export const suggestionBlockStyle =
  "bg-accent/70 text-accent-foreground border border-dashed border-primary/50"

/** Hatched open shift on the timeline. Labels are a touch darker than muted text, as in the design. */
export const openShiftBlockStyle = "bg-hatched text-foreground/70 ring-1 ring-inset ring-hatch/70"
