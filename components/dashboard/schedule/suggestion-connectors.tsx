"use client"

import * as React from "react"
import { AnimatePresence, motion, type Variants } from "motion/react"

import {
  DAY_END,
  type Caregiver,
  type OpenShift,
  type Suggestion,
  type Visit,
} from "@/lib/schedule-data"
import { EASE_IN_EXIT, EASE_IN_OUT, EASE_OUT } from "@/lib/motion"
import { hourToPercent } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

import { useSpotlit } from "./board-context"
import {
  BLOCK_INSET,
  OPEN_SHIFTS_CENTER,
  TRACK_OVERLAY,
  ghostDelay,
  laneCenter,
} from "./timeline-layout"

/** Where a previewed suggestion comes from and lands, in px from the timeline body's top. */
export type ConnectorSpec = {
  id: string
  /** The visit (or open shift) that would move. */
  sourceId: string
  toCaregiverId: string
  start: number
  end: number
  fromY: number
  toY: number
  /** Overtime saved, shown riding the arc. */
  savesHours?: number
}

/**
 * Who owns each visit right now. Filled shifts become visits under the shift's id, so this tells an
 * accepted suggestion (its source now belongs to the target) from a dismissed one.
 */
type ExitContext = ReadonlyMap<string, string>

const BULGE_MIN = 22
const BULGE_MAX = 46
const PAD = 8

/**
 * Lays out a connector for each previewed suggestion whose source and target lanes are both on
 * screen. `caregivers` is the visible list, so its order gives each lane's row.
 */
export function useConnectorSpecs({
  suggestions,
  visits,
  openShifts,
  caregivers,
  enabled,
}: {
  suggestions: readonly Suggestion[]
  visits: readonly Visit[]
  openShifts: readonly OpenShift[]
  caregivers: readonly Caregiver[]
  enabled: boolean
}) {
  return React.useMemo(() => {
    if (!enabled) return []
    const rowOf = new Map(caregivers.map((caregiver, index) => [caregiver.id, index]))
    const specs: ConnectorSpec[] = []
    for (const suggestion of suggestions) {
      const toRow = rowOf.get(suggestion.toCaregiverId)
      if (toRow === undefined) continue
      if (suggestion.kind === "reassign") {
        const visit = visits.find((v) => v.id === suggestion.visitId)
        const fromRow = rowOf.get(suggestion.fromCaregiverId)
        if (!visit || fromRow === undefined) continue
        specs.push({
          id: suggestion.id,
          sourceId: visit.id,
          toCaregiverId: suggestion.toCaregiverId,
          start: visit.start,
          end: visit.end,
          fromY: laneCenter(fromRow),
          toY: laneCenter(toRow),
          savesHours: suggestion.savesHours,
        })
      } else {
        const shift = openShifts.find((s) => s.id === suggestion.openShiftId)
        if (!shift) continue
        specs.push({
          id: suggestion.id,
          sourceId: shift.id,
          toCaregiverId: suggestion.toCaregiverId,
          start: shift.start,
          end: shift.end,
          fromY: OPEN_SHIFTS_CENTER,
          toY: laneCenter(toRow),
        })
      }
    }
    return specs
  }, [suggestions, visits, openShifts, caregivers, enabled])
}

/**
 * Dashed arcs tying each previewed move to its ghost: from the source block's edge, bowing out
 * beside the lanes in between, to the ghost. They draw in after the ghost lands; on accept they
 * retract toward the ghost as the block glides over, and on dismiss they fade.
 */
export function SuggestionConnectors({
  specs,
  visitOwners,
}: {
  specs: readonly ConnectorSpec[]
  visitOwners: ExitContext
}) {
  const spotlit = useSpotlit("suggestion")
  return (
    // Painted before the lanes, so blocks in the rows between sit on top of the arc.
    <motion.div
      aria-hidden
      className={cn(TRACK_OVERLAY, "pointer-events-none")}
      animate={{ opacity: spotlit ? 1 : 0.22 }}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence custom={visitOwners}>
        {specs.map((spec) => (
          <Connector key={spec.id} spec={spec} />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

function Connector({ spec, ref }: { spec: ConnectorSpec; ref?: React.Ref<HTMLDivElement> }) {
  const maskId = React.useId()
  // Bow out on the right of the block unless it ends the day, then on the left.
  const side = spec.end <= DAY_END - 0.75 ? 1 : -1
  const anchor = side === 1 ? hourToPercent(spec.end) : hourToPercent(spec.start)
  const distance = Math.abs(spec.toY - spec.fromY)
  const bulge = Math.min(BULGE_MAX, Math.max(BULGE_MIN, 12 + distance * 0.12))
  const width = bulge + PAD * 2
  const top = Math.min(spec.fromY, spec.toY) - PAD
  const height = distance + PAD * 2
  const y1 = spec.fromY - top
  const y2 = spec.toY - top
  // Local x runs away from the block edge; the svg is mirrored for left-hand arcs.
  const x0 = PAD - BLOCK_INSET + 3
  const d = `M ${x0} ${y1} C ${x0 + bulge} ${y1} ${x0 + bulge} ${y2} ${x0} ${y2}`
  const delay = ghostDelay(spec.start) + 0.3
  const accepted = (owners: ExitContext) =>
    owners.get(spec.sourceId) === spec.toCaregiverId

  const stroke: Variants = {
    hidden: { pathLength: 0, pathOffset: 0 },
    shown: { pathLength: 1, pathOffset: 0, transition: { delay, duration: 0.55, ease: EASE_IN_OUT } },
    exit: (owners: ExitContext) =>
      accepted(owners)
        ? { pathLength: 0, pathOffset: 1, transition: { duration: 0.5, ease: EASE_IN_OUT } }
        : {},
  }
  const frame: Variants = {
    hidden: { opacity: 1 },
    shown: { opacity: 1 },
    exit: (owners: ExitContext) =>
      accepted(owners)
        ? { opacity: 0, transition: { delay: 0.35, duration: 0.2 } }
        : { opacity: 0, transition: { duration: 0.2, ease: EASE_IN_EXIT } },
  }
  const fadeIn = (extra: number): Variants => ({
    hidden: { opacity: 0, scale: 0.6 },
    shown: { opacity: 1, scale: 1, transition: { delay: delay + extra, duration: 0.3, ease: EASE_OUT } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  })

  return (
    <motion.div
      ref={ref}
      className="absolute"
      style={{
        top,
        width,
        height,
        left: side === 1 ? `calc(${anchor}% - ${PAD}px)` : `calc(${anchor}% - ${width - PAD}px)`,
      }}
      variants={frame}
      initial="hidden"
      animate="shown"
      exit="exit"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        className={cn("absolute inset-0 overflow-visible", side === -1 && "-scale-x-100")}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            <motion.path d={d} stroke="white" strokeWidth={6} strokeLinecap="round" variants={stroke} />
          </mask>
        </defs>
        <path
          d={d}
          mask={`url(#${maskId})`}
          className="stroke-primary/60"
          strokeWidth={1.5}
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
        <motion.circle
          cx={x0}
          cy={y1}
          r={2.5}
          className="fill-primary/60"
          variants={fadeIn(0)}
          style={{ transformOrigin: `${x0}px ${y1}px` }}
        />
        <motion.path
          d={`M ${x0 + 5} ${y2 - 4} L ${x0} ${y2} L ${x0 + 5} ${y2 + 4}`}
          className="stroke-primary/70"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={fadeIn(0.45)}
          style={{ transformOrigin: `${x0}px ${y2}px` }}
        />
      </svg>
      {spec.savesHours ? (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-1.5 py-px text-[11px] leading-4 font-medium whitespace-nowrap text-primary-foreground tabular-nums shadow-sm"
          style={{
            top: (y1 + y2) / 2,
            // The arc's midpoint sits three quarters of the way out to its control points.
            left: side === 1 ? x0 + bulge * 0.75 : width - (x0 + bulge * 0.75),
          }}
          variants={fadeIn(0.5)}
        >
          −{spec.savesHours} h
        </motion.span>
      ) : null}
    </motion.div>
  )
}
