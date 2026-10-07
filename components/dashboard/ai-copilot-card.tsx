"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react"

import { describeSuggestions, plural } from "@/components/dashboard/cards/copilot-copy"
import { RollingNumber } from "@/components/dashboard/cards/rolling-number"
import { SparkleBurst } from "@/components/dashboard/cards/sparkle-burst"
import { useEntranceTiming } from "@/components/dashboard/cards/use-entrance-timing"
import { Reveal } from "@/components/dashboard/reveal"
import {
  useScheduleActions,
  useScheduleData,
  useScheduleUi,
} from "@/components/dashboard/schedule-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

type CopilotState = "ready" | "optimizing" | "clear"

/** Finds the card's main button, so the suggestions sheet can hand focus back to it. */
export const COPILOT_CTA_SELECTOR = "[data-copilot-cta]"

const swap = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  // Drop the filter once settled so the text doesn't keep an extra compositing layer.
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } },
  exit: { opacity: 0, y: -14, filter: "blur(6px)" },
  transition: { type: "spring", stiffness: 300, damping: 30 },
} as const

const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.03 },
}

const labelVariants: Variants = {
  rest: { x: 0 },
  hover: { x: -7 },
}

const arrowVariants: Variants = {
  rest: { opacity: 0, x: -8 },
  hover: { opacity: 1, x: 0 },
}

/*
 * The ambient loops below animate one whole `transform` string, so Motion hands them to WAAPI and
 * they run on the compositor (separate rotate/scale/x values would tick on the main thread). Each
 * cycle's rest is a held keyframe rather than a repeatDelay, which would force the JS path, and
 * every loop is bounded: it plays a few times, then the card sits still.
 */

/** Sparkle wiggle: a quick twist and pop in the first quarter of the cycle, then a hold. */
const WIGGLE = {
  transform: [
    "rotate(0deg) scale(1)",
    "rotate(-16deg) scale(1.28)",
    "rotate(12deg) scale(0.94)",
    "rotate(0deg) scale(1)",
    "rotate(0deg) scale(1)",
  ],
}
const WIGGLE_TRANSITION: Transition = {
  duration: 4.5,
  times: [0, 0.08, 0.16, 0.245, 1],
  ease: ["easeInOut", "easeInOut", "easeInOut", "linear"],
  // Three wiggles, then rest. The badge replays them whenever the card's state changes.
  repeat: 2,
}

const SHEEN_FROM = "translateX(-130%) skewX(-18deg)"
const SHEEN_TO = "translateX(330%) skewX(-18deg)"
const SWEEP_EASE = [0.45, 0, 0.2, 1] as const

/**
 * Counts how many times the queue has just been cleared (ready → caught up), so the card can
 * celebrate each time. Starting out caught up, or finishing an optimizer run, doesn't count.
 */
function useClearedCount(state: CopilotState) {
  const [previous, setPrevious] = React.useState(state)
  const [cleared, setCleared] = React.useState(0)
  if (state !== previous) {
    setPrevious(state)
    if (previous === "ready" && state === "clear") setCleared((n) => n + 1)
  }
  return cleared
}

export function AiCopilotCard() {
  const { suggestions, openShifts, overtimeCaregivers, pendingSavings, pendingFills } =
    useScheduleData()
  const { optimizing } = useScheduleUi()
  const { optimize, setPreviewSuggestions, setSuggestionsOpen } = useScheduleActions()
  const titleId = React.useId()
  // The first wiggle waits for the card's entrance; later ones (new state) follow the title swap.
  const entrance = useEntranceTiming(1.5)
  const count = suggestions.length
  const state: CopilotState = optimizing ? "optimizing" : count > 0 ? "ready" : "clear"
  const cleared = useClearedCount(state)

  const subtitle =
    state === "optimizing"
      ? "Checking overtime, travel time and open shifts."
      : state === "ready"
        ? describeSuggestions(pendingSavings, pendingFills)
        : openShifts.length === 0 && overtimeCaregivers.length === 0
          ? "No overtime or coverage gaps left today."
          : "No new suggestions. Run the optimizer after changes."

  function reviewAll() {
    setPreviewSuggestions(true)
    setSuggestionsOpen(true)
  }

  return (
    <Reveal delay={0.3} className="h-full min-w-0">
      <Card
        role="region"
        aria-labelledby={titleId}
        className="relative h-full min-h-[277px] gap-0 rounded-[24px] bg-copilot pb-7 text-copilot-foreground ring-0 [--card-spacing:28px]"
      >
        <DecorativeOrb pulse={cleared} />
        <Sheen fast={state === "optimizing"} />

        <CardHeader className="relative gap-0">
          <span className="relative flex w-fit">
            <Badge variant="inverse" className="h-6 pr-3 pl-2.5">
              {/* Wiggle a wrapper rather than the SVG itself, so the transform stays on the GPU. */}
              <motion.span
                key={state}
                aria-hidden
                className="flex"
                animate={WIGGLE}
                transition={{ ...WIGGLE_TRANSITION, delay: entrance.intro ? 1.2 : 0.3 }}
              >
                <HugeiconsIcon icon={SparklesIcon} size={12} strokeWidth={2.8} />
              </motion.span>
              AI Copilot
            </Badge>
            {cleared > 0 ? <SparkleBurst key={cleared} tone="inverse" spreadX={1.7} /> : null}
          </span>

          <CardTitle
            id={titleId}
            role="heading"
            aria-level={2}
            className="relative mt-3 text-[27px] leading-9 font-medium tracking-[-0.01em]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={state} className="block" {...swap}>
                {state === "ready" ? (
                  <>
                    <RollingNumber value={count} /> {plural(count, "suggestion", "suggestions")} ready
                  </>
                ) : state === "optimizing" ? (
                  "Finding savings…"
                ) : (
                  "You’re all caught up"
                )}
              </motion.span>
            </AnimatePresence>
          </CardTitle>

          <CardDescription
            aria-live="polite"
            className="relative mt-[13px] max-w-[300px] text-[17px] leading-6 text-copilot-foreground"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={subtitle}
                className="block"
                {...swap}
                transition={{ ...swap.transition, delay: 0.04 }}
              >
                {subtitle}
              </motion.span>
            </AnimatePresence>
          </CardDescription>
        </CardHeader>

        <CardFooter className="relative mt-auto">
          <Button
            asChild
            variant="inverse"
            size="lg"
            className="relative h-12 rounded-full px-6 text-[17px] focus-visible:ring-copilot-foreground/60 has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-5"
          >
            <motion.button
              type="button"
              data-copilot-cta=""
              disabled={optimizing}
              onClick={state === "ready" ? reviewAll : optimize}
              initial="rest"
              animate="rest"
              whileHover="hover"
              whileFocus="hover"
              whileTap={{ scale: 0.97 }}
              variants={buttonVariants}
            >
              {state === "optimizing" ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Optimizing
                </>
              ) : (
                <>
                  <motion.span variants={labelVariants}>
                    {state === "ready" ? "Review all" : "Run optimizer"}
                  </motion.span>
                  <motion.span
                    aria-hidden
                    variants={arrowVariants}
                    className="absolute right-3.5 flex"
                  >
                    <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} data-icon="inline-end" />
                  </motion.span>
                </>
              )}
            </motion.button>
          </Button>
        </CardFooter>
      </Card>
    </Reveal>
  )
}

/**
 * Soft circle bleeding off the top-right corner. It drifts for two slow cycles after load and
 * settles; hovering the card eases it a little further in. It swells once each time `pulse`
 * goes up (when the suggestion queue is cleared).
 */
function DecorativeOrb({ pulse }: { pulse: number }) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const reduceMotion = useReducedMotion()

  React.useEffect(() => {
    if (pulse === 0 || reduceMotion || !scope.current) return
    const controls = animate(
      scope.current,
      { scale: [1, 1.12, 1] },
      { duration: 0.9, times: [0, 0.4, 1], ease: "easeInOut" }
    )
    return () => controls.stop()
  }, [pulse, reduceMotion, animate, scope])

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -top-[151px] -right-[149px] size-[262px]"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.45 }}
    >
      <div ref={scope} className="size-full">
        {/*
          The float animates `transform`; the hover drift uses the separate `translate` and `scale`
          properties, so the two compose and neither snaps when the other starts or stops.
        */}
        <div className="size-full animate-float rounded-full bg-copilot-highlight transition-[translate,scale] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] [animation-iteration-count:2] motion-safe:group-hover/card:-translate-x-2.5 motion-safe:group-hover/card:translate-y-2 motion-safe:group-hover/card:scale-[1.05]" />
      </div>
    </motion.div>
  )
}

/**
 * Diagonal light sweep: shortly after mount, then twice more ~7s apart, then it rests off-card.
 * While optimizing it loops quickly instead; when the run ends it remounts and sweeps again.
 */
function Sheen({ fast }: { fast: boolean }) {
  return (
    <motion.div
      key={fast ? "fast" : "idle"}
      aria-hidden
      className="pointer-events-none absolute inset-y-[-20%] left-0 w-2/5 bg-linear-to-r from-transparent via-copilot-foreground/15 to-transparent"
      initial={{ transform: SHEEN_FROM }}
      animate={{ transform: [SHEEN_FROM, SHEEN_TO, SHEEN_TO] }}
      transition={
        fast
          ? // 1s sweep + 0.15s hold per cycle; four cycles outlast the optimizer's 1.4s run.
            { duration: 1.15, times: [0, 0.87, 1], ease: [SWEEP_EASE, "linear"], repeat: 3 }
          : // 1.5s sweep + 5.5s hold per cycle, three cycles.
            { duration: 7, times: [0, 0.215, 1], ease: [SWEEP_EASE, "linear"], delay: 1, repeat: 2 }
      }
    />
  )
}
