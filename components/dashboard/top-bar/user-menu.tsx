"use client"

import * as React from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  KeyboardIcon,
  Logout03Icon,
  Settings01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

import { PersonAvatar } from "@/components/dashboard/person-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CURRENT_USER } from "@/lib/schedule-data"

import { snappy, staggerDelay } from "./motion"

const itemMotion = "animate-in duration-300 fill-mode-backwards fade-in-0 slide-in-from-top-1"

/** Signed-in scheduler. The avatar's ring swells on hover and stays while the menu is open. */
export function UserMenu({ onOpenShortcuts }: { onOpenShortcuts: () => void }) {
  // "Keyboard shortcuts" waits for the menu to hand focus back to the avatar, so the
  // dialog remembers (and later restores) the avatar rather than an unmounted menu item.
  const shortcutsPendingRef = React.useRef(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          type="button"
          aria-label={`Account menu for ${CURRENT_USER.name}`}
          // Press is a CSS :active scale: motion's whileTap would make Enter open the menu
          // and immediately close it again (see CreateTrigger).
          className="group/avatar-trigger flex size-10 items-center justify-center rounded-full outline-none transition-[scale] duration-150 ease-out active:scale-[0.94] md:size-12 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          whileHover={{ scale: 1.04 }}
          transition={snappy}
        >
          <PersonAvatar
            name={CURRENT_USER.name}
            src={CURRENT_USER.avatar}
            className="size-9 ring-0 ring-primary/25 transition-[box-shadow] duration-300 ease-out group-hover/avatar-trigger:ring-4 group-aria-expanded/avatar-trigger:ring-4 md:size-11"
          />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60"
        onCloseAutoFocus={() => {
          if (!shortcutsPendingRef.current) return
          shortcutsPendingRef.current = false
          // Radix focuses the trigger right after this handler returns.
          requestAnimationFrame(() => onOpenShortcuts())
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 text-foreground">
            <span aria-hidden className="flex shrink-0">
              <PersonAvatar name={CURRENT_USER.name} src={CURRENT_USER.avatar} size="lg" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{CURRENT_USER.name}</span>
              <span className="truncate text-xs text-muted-foreground">{CURRENT_USER.role}</span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className={itemMotion}
            style={staggerDelay(1, 30)}
            onSelect={() => toast(`Opened ${CURRENT_USER.name}'s profile`)}
          >
            <HugeiconsIcon icon={UserCircleIcon} strokeWidth={1.8} aria-hidden />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemMotion}
            style={staggerDelay(2, 30)}
            onSelect={() => toast("Opened agency settings")}
          >
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={1.8} aria-hidden />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemMotion}
            style={staggerDelay(3, 30)}
            onSelect={() => {
              shortcutsPendingRef.current = true
            }}
          >
            <HugeiconsIcon icon={KeyboardIcon} strokeWidth={1.8} aria-hidden />
            Keyboard shortcuts
            <DropdownMenuShortcut>?</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className={itemMotion}
            style={staggerDelay(4, 30)}
            onSelect={() =>
              toast("Signed out", { description: "This is a demo, so you're still here." })
            }
          >
            <HugeiconsIcon icon={Logout03Icon} strokeWidth={1.8} aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
