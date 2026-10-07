"use client"

import { motion } from "motion/react"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { useScheduleData } from "@/components/dashboard/schedule-store"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { sidebarEnterDelay, snappy } from "@/lib/motion"
import { AGENCY } from "@/lib/schedule-data"
import { NavGroup } from "./nav-group"
import { OnShiftAvatars } from "./on-shift-avatars"
import { useRail } from "./use-rail"

const FACES = 4

/**
 * Folds a block's height to zero (grid rows 1fr to 0fr) and fades it, so swapping the full and
 * rail versions never makes the rows below jump.
 */
const FOLD =
  "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"

/** "On shift now": agency head count plus a stack of the caregivers working right now. */
export function OnShiftGroup({ step, className }: { step: number; className?: string }) {
  const { caregivers } = useScheduleData()
  const rail = useRail()
  const faces = caregivers.filter((caregiver) => caregiver.onShift).slice(0, FACES)
  const summary = `${AGENCY.caregiversOnShift} of ${AGENCY.caregiversTotal} caregivers on shift`

  return (
    <NavGroup label="On shift now" step={step} className={className}>
      <div
        inert={rail}
        className={`${FOLD} grid-rows-[1fr] group-data-[collapsible=icon]:grid-rows-[0fr] group-data-[collapsible=icon]:opacity-0`}
      >
        {/* The negative margin and padding leave room for the avatars' hover lift and fan-out. */}
        <div className="-m-2 min-h-0 overflow-hidden p-2">
          <div className="flex flex-col gap-[11px] px-3 pt-[3px]">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...snappy, delay: sidebarEnterDelay(step + 1) }}
              className="flex items-center gap-[9px]"
            >
              <span className="text-[14.5px] font-medium whitespace-nowrap text-foreground">
                Caregivers
              </span>
              <Badge
                variant="secondary"
                className="h-6 bg-panel px-[9px] text-[13px] font-normal text-muted-foreground"
              >
                <AnimatedNumber value={AGENCY.caregiversOnShift} delay={sidebarEnterDelay(step + 1)} />
                {` of ${AGENCY.caregiversTotal}`}
                <span className="sr-only"> caregivers on shift</span>
              </Badge>
            </motion.div>
            <OnShiftAvatars
              caregivers={faces}
              remaining={AGENCY.caregiversOnShift - faces.length}
              delay={sidebarEnterDelay(step + 2)}
            />
          </div>
        </div>
      </div>

      {/* Icon rail: the head count as one chip, with a live dot. */}
      <div
        aria-hidden={!rail}
        className={`${FOLD} grid-rows-[0fr] opacity-0 group-data-[collapsible=icon]:grid-rows-[1fr] group-data-[collapsible=icon]:opacity-100`}
      >
        <div className="min-h-0 overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="relative mx-auto my-1 flex size-9 items-center justify-center rounded-full bg-panel text-[13px] font-medium text-foreground tabular-nums">
                {AGENCY.caregiversOnShift}
                <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-in-progress ring-2 ring-sidebar" />
                <span className="sr-only">{` of ${AGENCY.caregiversTotal} caregivers on shift`}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" hidden={!rail}>
              {summary}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </NavGroup>
  )
}
