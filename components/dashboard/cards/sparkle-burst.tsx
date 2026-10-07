"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"

// Fixed layout (no Math.random) so server and client render the same particles.
const PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
  const distance = i % 2 === 0 ? 46 : 34
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    size: i % 2 === 0 ? "size-2" : "size-1.5",
    tone: ["bg-primary", "bg-in-progress", "bg-warning", "bg-copilot-highlight", "bg-primary"][i % 5],
    delay: 0.12 + (i % 3) * 0.04,
  }
})

/** One-shot burst of dots and a ring around its parent. Parent must be `relative`. */
export function SparkleBurst({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <motion.span
        className="absolute inset-0 rounded-full ring-2 ring-primary/40"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      />
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className={cn("absolute top-1/2 left-1/2 -mt-1 -ml-1 rounded-full", p.size, p.tone)}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: p.delay }}
        />
      ))}
    </span>
  )
}
