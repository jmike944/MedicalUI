"use client"

import * as React from "react"
import { motion, type Variants } from "motion/react"

import { CommandSearch } from "@/components/dashboard/command-search"
import { CreateMenu } from "@/components/dashboard/top-bar/create-menu"
import { HelpButton } from "@/components/dashboard/top-bar/help-button"
import { NotificationsButton } from "@/components/dashboard/top-bar/notifications-button"
import { OrgIdentity } from "@/components/dashboard/top-bar/org-identity"
import { SearchField, SearchIconButton } from "@/components/dashboard/top-bar/search-field"
import { ShortcutsDialog } from "@/components/dashboard/top-bar/shortcuts-dialog"
import { UserMenu } from "@/components/dashboard/top-bar/user-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { drop } from "@/lib/motion"

/** Parent of the entrance: org block, search, then each action button, 40ms apart. */
const entranceContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

/** Each top bar slot drops in from 8px above. */
const entranceItem: Variants = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: drop },
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

/** Agency identity, global search (⌘K) and the account cluster above the schedule panel. */
export function TopBar() {
  const [search, setSearch] = React.useState({ open: false, query: "" })
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)

  const openSearch = React.useCallback((query = "") => setSearch({ open: true, query }), [])
  const setSearchOpen = React.useCallback(
    (open: boolean) => setSearch((prev) => ({ ...prev, open })),
    []
  )
  const setSearchQuery = React.useCallback(
    (query: string) => setSearch((prev) => ({ ...prev, query })),
    []
  )
  const openShortcuts = React.useCallback(() => setShortcutsOpen(true), [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearch((prev) => (prev.open ? { ...prev, open: false } : { open: true, query: "" }))
        return
      }
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      if (event.key === "/") {
        event.preventDefault()
        openSearch()
      } else if (event.key === "?") {
        event.preventDefault()
        setShortcutsOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [openSearch])

  return (
    <>
      <motion.header
        variants={entranceContainer}
        initial="hidden"
        animate="show"
        className="flex h-16 shrink-0 items-center gap-2 px-3 sm:gap-3 md:h-[95px] md:pr-[23px] md:pb-[2px] md:pl-2"
      >
        <motion.div variants={entranceItem} className="md:hidden">
          <SidebarTrigger className="size-10 rounded-full [&_svg:not([class*='size-'])]:size-5" />
        </motion.div>
        <motion.div variants={entranceItem} className="min-w-0 flex-1 lg:flex-none xl:w-[312px]">
          <OrgIdentity />
        </motion.div>
        <motion.div variants={entranceItem} className="hidden min-w-0 flex-1 lg:block lg:max-w-[400px]">
          <SearchField open={search.open} onOpen={openSearch} />
        </motion.div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <motion.div variants={entranceItem} className="lg:hidden">
            <SearchIconButton onOpen={openSearch} />
          </motion.div>
          <motion.div variants={entranceItem} className="hidden sm:block">
            <HelpButton onOpenShortcuts={openShortcuts} />
          </motion.div>
          <motion.div variants={entranceItem}>
            <NotificationsButton />
          </motion.div>
          <motion.div variants={entranceItem}>
            <CreateMenu />
          </motion.div>
          <motion.div variants={entranceItem}>
            <UserMenu onOpenShortcuts={openShortcuts} />
          </motion.div>
        </div>
      </motion.header>

      <CommandSearch
        open={search.open}
        onOpenChange={setSearchOpen}
        query={search.query}
        onQueryChange={setSearchQuery}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  )
}
