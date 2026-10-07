import * as React from "react"

/**
 * Radix hands focus back to a menu's trigger when it closes. After a pointer pick that would leave
 * the keyboard focus ring on the trigger until the next click, so keep the focus but skip the ring;
 * menus closed from the keyboard still show it.
 *
 * Put `triggerRef` on the trigger and spread `contentProps` onto the menu's content.
 */
export function usePointerAwareMenuFocus<T extends HTMLElement>() {
  const triggerRef = React.useRef<T>(null)
  const viaPointer = React.useRef(false)
  const contentProps = {
    onPointerDown: () => {
      viaPointer.current = true
    },
    onPointerDownOutside: () => {
      viaPointer.current = true
    },
    onKeyDown: () => {
      viaPointer.current = false
    },
    onCloseAutoFocus: (event: Event) => {
      if (!viaPointer.current) return
      viaPointer.current = false
      event.preventDefault()
      triggerRef.current?.focus({ preventScroll: true, focusVisible: false })
    },
  }
  return { triggerRef, contentProps }
}
