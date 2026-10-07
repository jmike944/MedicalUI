"use client"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { AnimatePresence, motion, type Variants } from "motion/react"

import { cn } from "@/lib/utils"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { CountBadge } from "./count-badge"
import { bouncySpring, enterDelay, pillSpring, snappySpring } from "./motion"
import { useSidebarNav } from "./nav-context"

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: (step: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      default: snappySpring,
      x: { ...snappySpring, delay: enterDelay(step) },
      opacity: { duration: 0.28, ease: "easeOut", delay: enterDelay(step) },
    },
  }),
}

const iconVariants: Variants = {
  hover: { x: 2, rotate: -8, transition: bouncySpring },
  tap: { scale: 0.86, transition: { duration: 0.1 } },
}

/**
 * One sidebar destination. The active row hosts the shared highlight pill, so
 * picking another row makes the pill glide over to it.
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
  const isActive = activeId === id
  const showBadge = badge !== undefined && badge > 0

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "relative gap-3 overflow-visible rounded-[18px] px-3 transition-colors duration-200 hover:bg-sidebar-accent/50 data-active:bg-transparent data-active:font-semibold [&_svg]:size-5",
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
          {isActive ? (
            <motion.span
              layoutId="sidebar-active-pill"
              aria-hidden
              transition={pillSpring}
              style={{ borderRadius: 18 }}
              className="absolute inset-0 z-0 bg-sidebar-accent"
            />
          ) : null}
          <motion.span variants={iconVariants} className="relative z-[1] flex shrink-0">
            <HugeiconsIcon icon={icon} strokeWidth={1.6} />
          </motion.span>
          <span className="relative z-[1]">
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
        {showBadge ? <CountBadge key="badge" value={badge} delay={enterDelay(step) + 0.22} /> : null}
      </AnimatePresence>
    </SidebarMenuItem>
  )
}
