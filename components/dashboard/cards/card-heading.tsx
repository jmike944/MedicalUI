"use client"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { motion } from "motion/react"

import { CardTitle } from "@/components/ui/card"
import { twist } from "@/lib/motion"
import { cn } from "@/lib/utils"

/** Shared class for the white glance cards under the schedule. */
export const glanceCardClassName =
  "h-full min-h-[277px] gap-3 rounded-[24px] py-6 ring-0 [--card-spacing:23px]"

/** Round icon chip followed by the card title, as in "Open shifts" and "Overtime watch". */
export function CardHeading({
  icon,
  id,
  delay = 0,
  className,
  children,
}: {
  icon: IconSvgElement
  id?: string
  /** Delay for the icon chip's pop-in, so it lands with its card. */
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <CardTitle
      id={id}
      role="heading"
      aria-level={2}
      className={cn("flex items-center gap-3 text-xl leading-7 font-normal", className)}
    >
      <motion.span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-panel text-foreground"
        initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ ...twist, delay }}
        whileHover={{ scale: 1.08, rotate: -8 }}
      >
        <HugeiconsIcon icon={icon} strokeWidth={1.8} className="size-[18px]" />
      </motion.span>
      {children}
    </CardTitle>
  )
}
