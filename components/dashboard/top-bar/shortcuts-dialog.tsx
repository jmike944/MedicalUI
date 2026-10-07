"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

import { staggerDelay } from "./motion"
import { useRestoreFocus } from "./use-restore-focus"
import { useIsMac } from "./use-is-mac"

/** Cheat sheet opened from the help button, the account menu, or "?". */
export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const mod = useIsMac() ? "⌘" : "Ctrl"
  const focusReturn = useRestoreFocus()
  const shortcuts = [
    { label: "Search patients, caregivers, claims", keys: [mod, "K"] },
    { label: "Quick search", keys: ["/"] },
    { label: "Toggle sidebar", keys: [mod, "B"] },
    { label: "Show keyboard shortcuts", keys: ["?"] },
    { label: "Close any panel", keys: ["Esc"] },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-4 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:slide-in-from-bottom-4 sm:max-w-sm"
        onOpenAutoFocus={focusReturn.remember}
        onCloseAutoFocus={focusReturn.restore}
      >
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move around the schedule without the mouse.</DialogDescription>
        </DialogHeader>
        <ItemGroup className="gap-1">
          {shortcuts.map((shortcut, index) => (
            <Item
              key={shortcut.label}
              role="listitem"
              size="xs"
              variant="muted"
              className="animate-in duration-300 fill-mode-backwards fade-in-0 slide-in-from-bottom-2"
              style={staggerDelay(index + 2, 40)}
            >
              <ItemContent>
                <ItemTitle className="font-normal">{shortcut.label}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <KbdGroup>
                  {shortcut.keys.map((key) => (
                    <Kbd key={key} className="bg-background">
                      {key}
                    </Kbd>
                  ))}
                </KbdGroup>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </DialogContent>
    </Dialog>
  )
}
