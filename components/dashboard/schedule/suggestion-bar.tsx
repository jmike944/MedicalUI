"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, SparklesIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion } from "motion/react"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import {
  useScheduleActions,
  useScheduleData,
  useScheduleUi,
} from "@/components/dashboard/schedule-store"
import { Button } from "@/components/ui/button"
import { EASE_IN_EXIT, EASE_OUT, bouncier } from "@/lib/motion"

/** "Save 1.5 h · fill 1 shift", leaving out whichever part is zero. */
function impactSummary(savings: number, fills: number) {
  const parts: string[] = []
  if (savings > 0) parts.push(`Save ${savings} h`)
  if (fills > 0) parts.push(`${parts.length ? "fill" : "Fill"} ${fills} ${fills === 1 ? "shift" : "shifts"}`)
  return parts.join(" · ")
}

/** The bar's spring; the phone spacer opens on the same one so the two move together. */
const BAR_SPRING = { type: "spring", stiffness: 380, damping: 26, delay: 0.25 } as const

/** Room the two-line bar takes under the timeline in a narrow card (84px bar + gaps). */
const PHONE_ROOM = 92

/**
 * Floating action bar for previewed AI suggestions. It rides over the bottom of the timeline while
 * the ghosts are on the board: review them in the sheet, accept them all, or hide the preview.
 * Sits above the blocks and the now line, below popovers and the sheet.
 */
export function SuggestionBar() {
  const { suggestions, pendingSavings, pendingFills } = useScheduleData()
  const { previewSuggestions } = useScheduleUi()
  const { setSuggestionsOpen, acceptAllSuggestions, setPreviewSuggestions } = useScheduleActions()
  const count = suggestions.length
  const show = previewSuggestions && count > 0
  const impact = impactSummary(pendingSavings, pendingFills)

  return (
    <>
      {/* Narrow card: the bar wraps to two lines, so rather than cover the last lanes (where ghosts
          often land) it gets its own room under the timeline, opening in step with its spring. */}
      <motion.div
        aria-hidden
        className="@xl:hidden"
        initial={false}
        animate={{ height: show ? PHONE_ROOM : 0 }}
        transition={
          show
            ? { ...BAR_SPRING, damping: 34, delay: 0.15 }
            : { duration: 0.25, ease: EASE_OUT, delay: 0.1 }
        }
      />
      {/* In a wide card the bar takes the legend's row (the legend fades out underneath), so it
          never covers a visit; it centres on the hour track past the 184px name column. In a
          narrow card it sits in the room opened above. */}
      <div className="pointer-events-none absolute inset-x-3 -bottom-0.5 z-40 flex justify-center @xl:inset-x-6 @xl:-bottom-[38px] @3xl:left-[calc(var(--spacing)*6+184px)]">
        <AnimatePresence>
          {show ? (
            <motion.div
              key="suggestion-bar"
              role="region"
              aria-label="AI suggestions"
              className="pointer-events-auto flex w-full flex-wrap items-center gap-x-2 gap-y-2 rounded-3xl bg-popover p-1 pl-1.5 text-popover-foreground shadow-lg ring-1 ring-border @xl:w-auto @xl:flex-nowrap @xl:rounded-full"
              initial={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.97,
                filter: "blur(4px)",
                transition: { duration: 0.2, ease: EASE_IN_EXIT },
              }}
              transition={{
                y: BAR_SPRING,
                scale: BAR_SPRING,
                opacity: { duration: 0.25, ease: EASE_OUT, delay: 0.25 },
                filter: { duration: 0.3, ease: EASE_OUT, delay: 0.25 },
              }}
            >
              <motion.span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-copilot text-copilot-foreground"
                initial={{ scale: 0, rotate: -60 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...bouncier, delay: 0.4 }}
              >
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5" />
              </motion.span>
              <p className="flex min-w-0 flex-1 flex-col leading-tight @xl:flex-none @xl:flex-row @xl:items-baseline @xl:gap-2 @xl:pr-1">
                <span className="text-sm font-medium whitespace-nowrap">
                  <AnimatedNumber value={count} duration={0.6} /> AI{" "}
                  {count === 1 ? "suggestion" : "suggestions"}
                </span>
                {impact ? (
                  <span className="truncate text-xs text-muted-foreground @xl:text-sm">{impact}</span>
                ) : null}
              </p>
              <div className="flex gap-1.5 @max-xl:order-last @max-xl:w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="@max-xl:flex-1"
                  onClick={() => setSuggestionsOpen(true)}
                >
                  Review
                </Button>
                <Button size="sm" className="@max-xl:flex-1" onClick={acceptAllSuggestions}>
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    aria-hidden
                    data-icon="inline-start"
                  />
                  Accept all
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Hide suggestions"
                className="text-muted-foreground"
                onClick={(event) => {
                  setPreviewSuggestions(false)
                  // The bar is leaving with focus inside it; land on Optimize, which brings it back.
                  // A click with no pointer behind it (detail 0) came from the keyboard: keep the ring.
                  document
                    .querySelector<HTMLElement>("[data-schedule-optimize]")
                    ?.focus({ preventScroll: true, focusVisible: event.detail === 0 })
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  )
}
