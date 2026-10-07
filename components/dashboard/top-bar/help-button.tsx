"use client"

import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { HelpCircleIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { press } from "@/lib/motion"

/** Opens the keyboard shortcuts sheet; the "?" tilts like it's thinking on hover. */
export function HelpButton({ onOpenShortcuts }: { onOpenShortcuts: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="ghost"
          size="icon-xl"
          className="rounded-full text-foreground"
        >
          <motion.button
            type="button"
            aria-label="Help & shortcuts"
            aria-haspopup="dialog"
            onClick={onOpenShortcuts}
            whileHover="hover"
            whileTap="tap"
            transition={press}
            variants={{ tap: { scale: 0.9 } }}
          >
            <motion.span
              className="flex"
              variants={{ hover: { rotate: [0, -14, 10, 0], scale: 1.06 } }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.6} aria-hidden />
            </motion.span>
          </motion.button>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        Help & shortcuts
      </TooltipContent>
    </Tooltip>
  )
}
