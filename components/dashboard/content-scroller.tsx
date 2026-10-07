"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The scroll area inside the fixed lavender panel. Cards fade out at an edge only while there is
 * more to scroll that way: `data-scrolled` (content above) and `data-more` (content below) drive
 * the `scroll-fade` mask in globals.css. Both are set directly on the node, so scrolling never
 * re-renders the dashboard.
 */
export function ContentScroller({ className, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    let frame = 0
    const update = () => {
      frame = 0
      const { scrollTop, scrollHeight, clientHeight } = node
      node.toggleAttribute("data-scrolled", scrollTop > 0)
      node.toggleAttribute("data-more", scrollTop + clientHeight < scrollHeight - 1)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // Content height changes too (filtering rows, filled shifts), not just the viewport.
    const resize = new ResizeObserver(schedule)
    resize.observe(node)
    for (const child of node.children) resize.observe(child)

    update()
    node.addEventListener("scroll", schedule, { passive: true })
    return () => {
      node.removeEventListener("scroll", schedule)
      resize.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-slot="content-scroller"
      className={cn("scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}
      {...props}
    />
  )
}
