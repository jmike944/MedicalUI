"use client"

import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { AnimatePresence, motion, type Variants } from "motion/react"

import { bouncy, pill, sidebarEnterDelay, snappy } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { CountBadge } from "./count-badge"
import { useSidebarNav } from "./nav-context"
import { useNavGroup } from "./nav-group"

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: (step: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      default: snappy,
      x: { ...snappy, delay: sidebarEnterDelay(step) },
      opacity: { duration: 0.28, ease: "easeOut", delay: sidebarEnterDelay(step) },
    },
  }),
}

const iconVariants: Variants = {
  hover: { x: 2, rotate: -8, transition: bouncy },
  tap: { scale: 0.86, transition: { duration: 0.1 } },
}

/**
 * One sidebar destination. The active row hosts the shared highlight pill, so
 * picking another row makes the pill glide over to it. While its section is
 * collapsed, the section label hosts the pill instead.
 */
export function NavItem({
  id,
  label,
  icon,
  step,
  badge,
  badgeLabel,
  size = "default",
}: {
  id: string
  label: string
  icon: IconSvgElement
  /** Position in the top-to-bottom entrance cascade. */
  step: number
  badge?: number
  /** Screen reader wording for the badge, e.g. "need attention". */
  badgeLabel?: string
  size?: "default" | "compact"
}) {
  const { activeId, select } = useSidebarNav()
  const group = useNavGroup()
  const register = group?.register
  React.useEffect(() => register?.(id), [register, id])

  const isActive = activeId === id
  const hostsPill = isActive && (group?.open ?? true)
  const showBadge = badge !== undefined && badge > 0

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        // Shown only in the icon rail (SidebarMenuButton hides it otherwise).
        tooltip={label}
        className={cn(
          "relative gap-3 overflow-visible rounded-[18px] px-3 text-muted-foreground transition-[color,background-color,width,height,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-sidebar-accent/50 data-active:bg-transparent data-active:font-semibold [&_svg]:size-5",
          // Icon rail: a 44px square around the icon; the label is clipped and faded.
          "group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:p-3!",
          size === "compact" ? "h-[38px] text-[15px]" : "h-10 text-base"
        )}
      >
        <motion.a
          href="#"
          aria-current={isActive ? "page" : undefined}
          onClick={(event) => {
            event.preventDefault()
            select(id)
          }}
          custom={step}
          variants={rowVariants}
          initial="hidden"
          animate="show"
          whileHover="hover"
          whileTap="tap"
        >
          {hostsPill ? (
            <motion.span
              layoutId="sidebar-active-pill"
              aria-hidden
              transition={pill}
              style={{ borderRadius: 18 }}
              className="absolute inset-0 z-0 bg-sidebar-accent"
            />
          ) : null}
          <motion.span variants={iconVariants} className="relative z-[1] flex shrink-0">
            <HugeiconsIcon icon={icon} strokeWidth={1.6} aria-hidden />
          </motion.span>
          <span className="relative z-[1] whitespace-nowrap transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            {label}
            {showBadge && badgeLabel ? (
              <span className="sr-only">
                {`, ${badge} ${badgeLabel}`}
              </span>
            ) : null}
          </span>
        </motion.a>
      </SidebarMenuButton>
      <AnimatePresence>
        {showBadge ? <CountBadge key="badge" value={badge} delay={sidebarEnterDelay(step) + 0.22} /> : null}
      </AnimatePresence>
    </SidebarMenuItem>
  )
}
