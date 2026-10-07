"use client"

import * as React from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

import { snappy } from "./motion"
import { useIsMac } from "./use-is-mac"

const PLACEHOLDER = "Search patients, caregivers, claims"

/**
 * The header search. It is a real input, but searching happens in the command palette:
 * focusing, clicking or typing opens it (typed characters carry over as the query).
 */
export function SearchField({
  open,
  onOpen,
  skipFocusOpenRef,
  className,
}: {
  open: boolean
  onOpen: (query?: string) => void
  /** Set while focus returns here from the palette, so it doesn't reopen. */
  skipFocusOpenRef: React.RefObject<boolean>
  className?: string
}) {
  const isMac = useIsMac()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [active, setActive] = React.useState(false)
  const lit = active || open

  return (
    <motion.div
      className={cn("relative w-full", className)}
      initial="rest"
      animate={lit ? "active" : "rest"}
      whileHover="active"
      variants={{ rest: { scale: 1 }, active: { scale: 1.01 } }}
      transition={snappy}
    >
      <InputGroup
        className={cn(
          "h-12 rounded-full border-transparent bg-panel shadow-none ring-0 ring-primary/0 transition-[box-shadow,background-color] duration-300 dark:bg-panel",
          "hover:shadow-lg hover:ring-4 hover:shadow-primary/15 hover:ring-primary/15",
          "has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:shadow-lg has-[[data-slot=input-group-control]:focus-visible]:ring-4 has-[[data-slot=input-group-control]:focus-visible]:shadow-primary/15 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20",
          open && "shadow-lg ring-4 shadow-primary/15 ring-primary/20"
        )}
      >
        <InputGroupInput
          ref={inputRef}
          type="search"
          value=""
          aria-label={PLACEHOLDER}
          aria-haspopup="dialog"
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          placeholder={PLACEHOLDER}
          autoComplete="off"
          spellCheck={false}
          className="h-full truncate px-0 text-[15px] text-foreground placeholder:text-muted-foreground md:text-[15px] [&::-webkit-search-cancel-button]:hidden"
          onFocus={() => {
            setActive(true)
            if (skipFocusOpenRef.current) {
              skipFocusOpenRef.current = false
              return
            }
            onOpen()
          }}
          onBlur={() => setActive(false)}
          onMouseDown={() => {
            // Clicking an already-focused field (after the palette returned focus here).
            if (document.activeElement === inputRef.current) onOpen()
          }}
          onChange={(event) => onOpen(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "ArrowDown") {
              event.preventDefault()
              onOpen()
            }
          }}
        />
        <InputGroupAddon
          className="pr-[5px] pl-[19px] text-muted-foreground"
          onClick={() => onOpen()}
        >
          <motion.span
            aria-hidden
            className="flex size-[22px] items-center justify-center"
            variants={{
              rest: { x: 0, rotate: 0, scale: 1 },
              active: { x: 1.5, rotate: -12, scale: 1.08 },
            }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={1.7} className="size-[22px]" />
          </motion.span>
        </InputGroupAddon>
        <InputGroupAddon
          align="inline-end"
          className="cursor-pointer pr-1.5 **:data-[slot=kbd]:rounded-full **:data-[slot=kbd]:bg-primary **:data-[slot=kbd]:px-0"
          onClick={() => onOpen()}
        >
          <ShortcutPill label={isMac ? "⌘K" : "Ctrl K"} />
        </InputGroupAddon>
      </InputGroup>
    </motion.div>
  )
}

/** The "⌘K" hint. Pulses once after the entrance settles to teach the shortcut. */
function ShortcutPill({ label }: { label: string }) {
  return (
    <span className="relative inline-flex">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: [0, 0.35, 0], scale: [1, 1.08, 1.45] }}
        transition={{ delay: 0.9, duration: 1, ease: "easeOut", times: [0, 0.2, 1] }}
      />
      <motion.span
        className="relative inline-flex"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 0.97, 1] }}
        transition={{ delay: 0.9, duration: 0.6, ease: "easeInOut", times: [0, 0.35, 0.7, 1] }}
      >
        <Kbd className="h-8 w-12 text-[13px] font-medium text-primary-foreground">{label}</Kbd>
      </motion.span>
    </span>
  )
}

/** Compact trigger for small screens, where the field collapses to an icon. */
export function SearchIconButton({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-10 rounded-full [&_svg:not([class*='size-'])]:size-[22px]"
    >
      <motion.button
        type="button"
        aria-label={PLACEHOLDER}
        aria-haspopup="dialog"
        onClick={() => onOpen()}
        whileHover="hover"
        whileTap={{ scale: 0.92 }}
        transition={snappy}
      >
        <motion.span
          className="flex"
          variants={{ hover: { rotate: -12, scale: 1.08 } }}
          transition={{ type: "spring", stiffness: 600, damping: 18 }}
        >
          <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} />
        </motion.span>
      </motion.button>
    </Button>
  )
}
