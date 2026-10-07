"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"

const TONES = {
  default: ["bg-primary", "bg-in-progress", "bg-warning", "bg-copilot-highlight", "bg-primary"],
  // For bursts on the blue copilot card, where primary-coloured dots would disappear.
  inverse: [
    "bg-primary-foreground",
    "bg-in-progress",
    "bg-primary-foreground",
    "bg-warning",
    "bg-primary-foreground",
  ],
} as const

// Fixed layout (no Math.random) so server and client render the same particles.
const PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
  const distance = i % 2 === 0 ? 46 : 34
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size: i % 2 === 0 ? "size-2" : "size-1.5",
    tone: i % 5,
    delay: 0.12 + (i % 3) * 0.04,
  }
})

/**
 * One-shot burst of dots and a ring around its parent. Parent must be `relative`.
 * `spreadX` widens the burst for wide parents such as a pill badge.
 */
export function SparkleBurst({
  tone = "default",
  spreadX = 1,
  className,
}: {
  tone?: keyof typeof TONES
  spreadX?: number
  className?: string
}) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <motion.span
        className={cn(
          "absolute inset-0 rounded-full ring-2 ring-primary/40",
          tone === "inverse" && "ring-primary-foreground/60"
        )}
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      />
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className={cn("absolute top-1/2 left-1/2 -mt-1 -ml-1 rounded-full", p.size, TONES[tone][p.tone])}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{
            x: Math.round(p.x * spreadX),
            y: Math.round(p.y),
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: p.delay }}
        />
      ))}
    </span>
  )
}
