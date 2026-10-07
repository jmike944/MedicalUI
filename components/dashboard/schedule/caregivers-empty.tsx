"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { UserMultipleIcon } from "@hugeicons/core-free-icons"
import { motion } from "motion/react"

import { useSchedule } from "@/components/dashboard/schedule-store"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { EASE_OUT } from "./timeline-layout"

/** Shown when the caregiver filter leaves no rows, e.g. once every overtime risk is resolved. */
export function CaregiversEmpty({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  const { filter, setFilter } = useSchedule()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.1 }}
    >
      <Empty className="gap-3 p-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={1.8} />
          </EmptyMedia>
          <EmptyTitle className="text-base">
            {filter === "overtime" ? "No overtime risks" : "No caregivers on shift"}
          </EmptyTitle>
          <EmptyDescription>
            {filter === "overtime"
              ? "Everyone is comfortably under their weekly limit."
              : "Nobody matches this filter right now."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary" size="sm" onClick={() => setFilter("all")}>
            Show all caregivers
          </Button>
        </EmptyContent>
      </Empty>
    </motion.div>
  )
}
