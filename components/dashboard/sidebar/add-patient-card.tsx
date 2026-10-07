"use client"

import * as React from "react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { toast } from "sonner"

import { bouncySpring, enterDelay, snappySpring } from "./motion"

/** One dash plus one gap of the outline, in px. Marching by a multiple of it loops seamlessly. */
const DASH_PERIOD = 10
/** Phase that lines the dashes up with the design's corners. */
const DASH_PHASE = 3

const plusVariants: Variants = {
  rest: { rotate: 0, scale: 1, transition: bouncySpring },
  active: { rotate: 90, scale: 1.12, transition: bouncySpring },
}

/**
 * Dashed "Add a patient" drop zone pinned to the bottom of the sidebar. While
 * hovered or focused its dashed outline marches, the plus turns and the card tints.
 */
export function AddPatientCard({ step }: { step: number }) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const active = hovered || focused

  const outlineVariants: Variants = {
    rest: {
      strokeDashoffset: DASH_PHASE,
      strokeOpacity: 0.85,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    active: {
      strokeDashoffset: reduceMotion ? DASH_PHASE : DASH_PHASE - DASH_PERIOD * 2,
      strokeOpacity: 1,
      transition: {
        strokeDashoffset: { duration: 1.4, ease: "linear", repeat: Infinity },
        strokeOpacity: { duration: 0.2 },
      },
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        default: snappySpring,
        y: { ...snappySpring, delay: enterDelay(step) },
        opacity: { duration: 0.35, delay: enterDelay(step) },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      // Press feedback is CSS :active. A motion press gesture would make this div a tab stop.
      className="group/add relative flex h-[140px] shrink-0 flex-col items-center rounded-[24px] bg-panel pt-5 transition-[background-color,scale] duration-300 ease-out hover:bg-accent active:scale-[0.98] active:duration-150"
    >
      <motion.svg
        aria-hidden
        initial={false}
        animate={active ? "active" : "rest"}
        className="pointer-events-none absolute inset-px size-[calc(100%-2px)] overflow-visible text-primary"
      >
        <motion.rect
          width="100%"
          height="100%"
          rx={23}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray="6 4"
          variants={outlineVariants}
        />
      </motion.svg>
      <motion.span
        aria-hidden
        initial={false}
        animate={active ? "active" : "rest"}
        variants={plusVariants}
        className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-primary/30 transition-shadow duration-300 group-hover/add:shadow-lg group-has-focus-visible/add:shadow-lg"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={20} strokeWidth={1.8} aria-hidden />
      </motion.span>
      <button
        type="button"
        onClick={() =>
          toast("New patient intake", {
            description: "Add demographics, payer and care needs to start scheduling.",
          })
        }
        className="mt-2.5 text-base leading-[22px] font-semibold text-foreground outline-none after:absolute after:inset-0 after:rounded-[24px] after:ring-sidebar-ring focus-visible:after:ring-2"
      >
        Add a patient
      </button>
      <p className="mt-2 text-[14.5px] leading-5 text-muted-foreground">
        Or{" "}
        <button
          type="button"
          onClick={() =>
            toast("Import a referral", {
              description: "Drop in a referral PDF or fax to prefill the intake.",
            })
          }
          // Primary nudged toward the foreground so the link clears 4.5:1 on the panel in both themes.
          className="relative z-[1] cursor-pointer rounded-sm text-[color-mix(in_oklab,var(--primary)_84%,var(--foreground))] underline-offset-2 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          import a referral
        </button>
      </p>
    </motion.div>
  )
}
