"use client"

import * as React from "react"

import { useSidebar } from "@/components/ui/sidebar"

type SidebarNavContextValue = {
  activeId: string
  /** Marks a nav entry as current, and closes the sheet on mobile. */
  select: (id: string) => void
}

const SidebarNavContext = React.createContext<SidebarNavContextValue | null>(null)

/** Holds which sidebar entry is current, so every group's items share one highlight. */
export function SidebarNavProvider({
  defaultActiveId,
  children,
}: {
  defaultActiveId: string
  children: React.ReactNode
}) {
  const [activeId, setActiveId] = React.useState(defaultActiveId)
  const { isMobile, setOpenMobile } = useSidebar()

  const value = React.useMemo<SidebarNavContextValue>(
    () => ({
      activeId,
      select: (id) => {
        setActiveId(id)
        if (isMobile) setOpenMobile(false)
      },
    }),
    [activeId, isMobile, setOpenMobile]
  )

  return <SidebarNavContext value={value}>{children}</SidebarNavContext>
}

export function useSidebarNav() {
  const context = React.use(SidebarNavContext)
  if (!context) throw new Error("useSidebarNav must be used within a SidebarNavProvider.")
  return context
}
