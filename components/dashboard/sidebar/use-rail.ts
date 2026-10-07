"use client"

import { useSidebar } from "@/components/ui/sidebar"

/** True while the desktop sidebar is collapsed to its icon rail (never in the mobile sheet). */
export function useRail() {
  const { state, isMobile } = useSidebar()
  return state === "collapsed" && !isMobile
}
