"use client"

import * as React from "react"
import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion } from "motion/react"

import { bouncy, pill, sidebarEnterDelay, snappy } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar"
import { useSidebarNav } from "./nav-context"
import { useRail } from "./use-rail"

type NavGroupContextValue = {
  /** Whether the section is expanded, so its rows can host the active pill. */
  open: boolean
  /** Lists a row under this section; returns the cleanup that removes it. */
  register: (id: string) => () => void
}

const NavGroupContext = React.createContext<NavGroupContextValue | null>(null)

/** The section a nav row sits in, if any. */
export function useNavGroup() {
  return React.use(NavGroupContext)
}

/**
 * A titled sidebar section whose label row collapses it. The body animates its
 * height and opacity; the chevron flips to show the state. While collapsed over
 * the current page, the active pill glides up into the label so the location stays visible.
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
  const { activeId } = useSidebarNav()
  const rail = useRail()
  const [expanded, setExpanded] = React.useState(true)
  // The icon rail has no section labels to reopen from, so every section shows there.
  const open = expanded || rail
  // Clip only while collapsed or animating, so the active pill can glide in from another group.
  const [animating, setAnimating] = React.useState(false)
  const [ids, setIds] = React.useState<ReadonlySet<string>>(() => new Set())

  const register = React.useCallback((id: string) => {
    setIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
    return () =>
      setIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
  }, [])

  const groupValue = React.useMemo(() => ({ open, register }), [open, register])
  const holdsActive = !open && ids.has(activeId)

  return (
    <NavGroupContext value={groupValue}>
      <Collapsible open={open} onOpenChange={setExpanded} asChild>
        <SidebarGroup className={cn("p-0", className)}>
          <SidebarGroupLabel
            asChild
            data-holds-active={holdsActive ? "" : undefined}
            // In the icon rail the label folds away (no height, faded) and leaves the tab order.
            className="group/label relative h-6 w-full justify-between rounded-lg px-3 text-[13px] font-semibold tracking-[0.08em] whitespace-nowrap text-foreground uppercase transition-[margin,opacity,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-holds-active:text-sidebar-accent-foreground group-data-[collapsible=icon]:-mt-6 group-data-[collapsible=icon]:duration-200"
          >
            <CollapsibleTrigger asChild>
              <motion.button
                type="button"
                inert={rail}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...snappy, delay: sidebarEnterDelay(step) }}
              >
                {holdsActive ? (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    aria-hidden
                    transition={pill}
                    style={{ borderRadius: 16 }}
                    className="absolute inset-x-0 -inset-y-1 z-0 bg-sidebar-accent"
                  />
                ) : null}
                {/* Children fade in the rail rather than the button: motion owns the button's
                    inline opacity for its entrance, which would override a CSS fade. */}
                <span className="relative z-[1] transition-opacity duration-150 group-data-[collapsible=icon]:opacity-0">
                  {label}
                  {holdsActive ? <span className="sr-only">, includes the current page</span> : null}
                </span>
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ rotate: open ? 0 : 180 }}
                  transition={bouncy}
                  className="relative z-[1] -mr-1 flex size-6 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,opacity] group-data-[collapsible=icon]:opacity-0 group-hover/label:bg-sidebar-accent group-hover/label:text-sidebar-accent-foreground group-data-holds-active/label:text-sidebar-accent-foreground"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} size={16} strokeWidth={1.8} aria-hidden />
                </motion.span>
              </motion.button>
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          {/* Rail-only divider standing in for the label between sections. */}
          {step > 0 ? (
            <span
              aria-hidden
              className="mx-auto block h-px w-0 bg-sidebar-border transition-[width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:mb-2.5 group-data-[collapsible=icon]:w-6"
            />
          ) : null}
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
    </NavGroupContext>
  )
}
