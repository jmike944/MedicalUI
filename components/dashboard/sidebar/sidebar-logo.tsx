"use client"

import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, type Variants } from "motion/react"

const markVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 420, damping: 20, opacity: { duration: 0.2 } },
  },
  tap: { scale: 0.92 },
}

const crossVariants: Variants = {
  hidden: { rotate: -90, scale: 0.6 },
  show: {
    rotate: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 13, delay: 0.06 },
  },
  hover: { rotate: 90, transition: { type: "spring", stiffness: 300, damping: 14 } },
}

const wordVariants: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 420, damping: 34, delay: 0.1 },
  },
}

/** CareOps wordmark. The cross spins in on load and turns again on hover. */
export function SidebarLogo() {
  return (
    <motion.a
      href="#"
      aria-label="CareOps home"
      onClick={(event) => event.preventDefault()}
      initial="hidden"
      animate="show"
      whileHover="hover"
      whileTap="tap"
      className="flex w-fit items-center gap-3 rounded-full pr-2 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
    >
      <motion.span
        variants={markVariants}
        className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary text-in-progress"
      >
        <motion.span variants={crossVariants} className="flex">
          <HugeiconsIcon icon={PlusSignIcon} size={20} strokeWidth={6.5} aria-hidden />
        </motion.span>
      </motion.span>
      <motion.span
        variants={wordVariants}
        className="text-[21px] leading-none font-medium tracking-[-0.01em] text-foreground"
      >
        CareOps
      </motion.span>
    </motion.a>
  )
}
