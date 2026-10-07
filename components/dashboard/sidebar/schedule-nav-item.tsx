"use client"

import { Calendar03Icon } from "@hugeicons/core-free-icons"

import { useScheduleData } from "@/components/dashboard/schedule-store"
import { NavItem } from "./nav-item"

/** "Schedule" entry whose badge counts open shifts plus visits that need attention, live. */
export function ScheduleNavItem({ step }: { step: number }) {
  const { openShifts, visits } = useScheduleData()
  const needsAttention =
    openShifts.length + visits.filter((visit) => visit.status === "attention").length

  return (
    <NavItem
      id="schedule"
      label="Schedule"
      icon={Calendar03Icon}
      step={step}
      badge={needsAttention}
      badgeLabel="need attention"
    />
  )
}
