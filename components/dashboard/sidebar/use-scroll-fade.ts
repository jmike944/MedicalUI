"use client"

import * as React from "react"

/** Longest fade (px) shown at an edge that has more content beyond it. */
const MAX_FADE = 32

/**
 * Callback ref that fades the edges of a scroll container with more content past
 * them. Sets `data-scroll-fade` while the content overflows, plus `--fade-top` /
 * `--fade-bottom` that grow with the distance left to scroll, so each fade eases
 * out instead of snapping off as that end is reached. Pair with a `mask-image`
 * that reads them. A callback ref, so it also attaches when the element mounts
 * later (the sidebar's mobile sheet only renders while open).
 */
export function useScrollFade<T extends HTMLElement>() {
  return React.useCallback((el: T | null) => {
    if (!el) return

    const update = () => {
      const overflow = el.scrollHeight - el.clientHeight
      if (overflow < 1) {
        delete el.dataset.scrollFade
        return
      }
      const top = Math.min(MAX_FADE, Math.max(0, el.scrollTop))
      const bottom = Math.min(MAX_FADE, Math.max(0, overflow - el.scrollTop))
      el.style.setProperty("--fade-top", `${top}px`)
      el.style.setProperty("--fade-bottom", `${bottom}px`)
      el.dataset.scrollFade = ""
    }

    update()
    el.addEventListener("scroll", update, { passive: true })
    // The box resizes with the viewport; its children resize when sections collapse.
    const observer = new ResizeObserver(update)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)

    return () => {
      el.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [])
}
