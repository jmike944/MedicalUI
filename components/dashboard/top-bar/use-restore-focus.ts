"use client"

import * as React from "react"

/**
 * Radix dialogs return focus to their `DialogTrigger`. The top bar opens dialogs from
 * shortcuts, inputs and menus instead, so remember whatever had focus and restore it.
 */
export function useRestoreFocus() {
  const previous = React.useRef<HTMLElement | null>(null)

  return React.useMemo(
    () => ({
      /** Call from `onOpenAutoFocus`, before focus moves into the dialog. */
      remember: () => {
        const el = document.activeElement
        previous.current = el instanceof HTMLElement && el !== document.body ? el : null
      },
      /** Call from `onCloseAutoFocus`. Falls back to Radix's default when nothing is stored. */
      restore: (event: Event) => {
        const el = previous.current
        previous.current = null
        if (!el?.isConnected) return
        event.preventDefault()
        el.focus({ preventScroll: true })
      },
    }),
    []
  )
}
