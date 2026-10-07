"use client"

import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, type Variants } from "motion/react"

import { Kbd } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { twist } from "@/lib/motion"
import { useRail } from "./use-rail"

/** Id of the desktop sidebar container, for the toggle's aria-controls. */
export const SIDEBAR_ID = "app-sidebar"

const markVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 420, damping: 20, opacity: { duration: 0.2 } },
  },
  tap: { scale: 0.92 },
}

const crossVariants: Variants = {
  hidden: { rotate: -90, scale: 0.6 },
  show: {
    rotate: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 13, delay: 0.06 },
  },
  hover: { rotate: 90, transition: { type: "spring", stiffness: 300, damping: 14 } },
}

const wordVariants: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 420, damping: 34, delay: 0.1 },
  },
}

/**
 * CareOps mark and wordmark, doubling as the sidebar toggle: it collapses the sidebar to its icon
 * rail and expands it again (⌘B does the same). The cross spins in on load, turns on hover and
 * makes a half turn on every toggle. In the mobile sheet it closes the sheet.
 */
export function SidebarLogo() {
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar()
  const rail = useRail()
  const action = isMobile ? "Close navigation" : rail ? "Expand sidebar" : "Collapse sidebar"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          aria-label={action}
          aria-expanded={isMobile ? undefined : !rail}
          aria-controls={isMobile ? undefined : SIDEBAR_ID}
          onClick={() => (isMobile ? setOpenMobile(false) : toggleSidebar())}
          initial="hidden"
          animate="show"
          whileHover="hover"
          whileTap="tap"
          className="flex w-fit items-center gap-3 rounded-full pr-2 outline-none transition-[gap,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:pr-0"
        >
          <motion.span
            variants={markVariants}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-in-progress"
          >
            {/* Half turn per toggle; the inner span keeps the entrance spin and hover turn. */}
            <motion.span
              initial={false}
              animate={{ rotate: rail ? 180 : 0 }}
              transition={twist}
              className="flex"
            >
              <motion.span variants={crossVariants} className="flex">
                <HugeiconsIcon icon={PlusSignIcon} size={20} strokeWidth={6.5} aria-hidden />
              </motion.span>
            </motion.span>
          </motion.span>
          {/* The wrapper folds the wordmark away in the rail (CSS); the inner span keeps its
              entrance (motion owns its inline opacity). Vertical padding keeps the "p" unclipped. */}
          <span
            aria-hidden
            className="-my-1 max-w-32 overflow-hidden py-1 transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:duration-200"
          >
            <motion.span
              variants={wordVariants}
              className="block text-[21px] leading-none font-medium tracking-[-0.01em] whitespace-nowrap text-foreground"
            >
              CareOps
            </motion.span>
          </span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={isMobile}>
        {action}
        <Kbd>⌘B</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}
