"use client"

import * as React from "react"
import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar"
import { bouncySpring, enterDelay, snappySpring } from "./motion"

/**
 * A titled sidebar section whose label row collapses it. The body animates its
 * height and opacity; the chevron flips to show the state.
 */
export function NavGroup({
  label,
  step,
  className,
  children,
}: {
  label: string
  /** Position of the label in the top-to-bottom entrance cascade. */
  step: number
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(true)
  // Clip only while collapsed or animating, so the active pill can glide in from another group.
  const [animating, setAnimating] = React.useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarGroup className={cn("p-0", className)}>
        <SidebarGroupLabel
          asChild
          className="group/label h-6 w-full justify-between rounded-lg px-3 text-[13px] font-semibold tracking-[0.08em] text-foreground uppercase transition-none"
        >
          <CollapsibleTrigger asChild>
            <motion.button
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...snappySpring, delay: enterDelay(step) }}
            >
              <span>{label}</span>
              <motion.span
                aria-hidden
                initial={false}
                animate={{ rotate: open ? 0 : 180 }}
                transition={bouncySpring}
                className="-mr-1 flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover/label:bg-sidebar-accent group-hover/label:text-sidebar-accent-foreground"
              >
                <HugeiconsIcon icon={ArrowUp01Icon} size={16} strokeWidth={1.8} />
              </motion.span>
            </motion.button>
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent forceMount asChild>
          <motion.div
            initial={false}
            animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{
              height: { type: "spring", stiffness: 380, damping: 40, mass: 0.8 },
              opacity: { duration: open ? 0.28 : 0.16, delay: open ? 0.06 : 0 },
            }}
            onAnimationStart={() => setAnimating(true)}
            onAnimationComplete={() => setAnimating(false)}
            inert={!open}
            className={cn(!open || animating ? "overflow-hidden" : "overflow-visible")}
          >
            <SidebarGroupContent className="pt-1.5">{children}</SidebarGroupContent>
          </motion.div>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
