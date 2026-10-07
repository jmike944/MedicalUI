"use client"

import { motion } from "motion/react"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { useScheduleData } from "@/components/dashboard/schedule-store"
import { Badge } from "@/components/ui/badge"
import { sidebarEnterDelay, snappy } from "@/lib/motion"
import { AGENCY } from "@/lib/schedule-data"
import { NavGroup } from "./nav-group"
import { OnShiftAvatars } from "./on-shift-avatars"

const FACES = 4

/** "On shift now": agency head count plus a stack of the caregivers working right now. */
export function OnShiftGroup({ step, className }: { step: number; className?: string }) {
  const { caregivers } = useScheduleData()
  const faces = caregivers.filter((caregiver) => caregiver.onShift).slice(0, FACES)

  return (
    <NavGroup label="On shift now" step={step} className={className}>
      <div className="flex flex-col gap-[11px] px-3 pt-[3px]">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...snappy, delay: sidebarEnterDelay(step + 1) }}
          className="flex items-center gap-[9px]"
        >
          <span className="text-[14.5px] font-medium text-foreground">Caregivers</span>
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
    </NavGroup>
  )
}
