"use client"

import * as React from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  CalendarAdd01Icon,
  Doctor01Icon,
  FileImportIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { snappy, staggerDelay } from "./motion"

const actions = [
  {
    label: "New visit",
    icon: CalendarAdd01Icon,
    toast: "New visit started",
    description: "Pick a patient and a caregiver to place it on the board.",
  },
  {
    label: "New patient",
    icon: UserAdd01Icon,
    toast: "New patient intake opened",
    description: "Add demographics, payer, and care plan.",
  },
  {
    label: "New caregiver",
    icon: Doctor01Icon,
    toast: "New caregiver onboarding opened",
    description: "Credentials and availability come next.",
  },
  {
    label: "Import referral",
    icon: FileImportIcon,
    toast: "Referral import ready",
    description: "Drop a PDF or fax and CareOps will pre-fill the intake.",
  },
] as const

/** The "+" button. It spins a quarter turn on hover and settles into an "x" while open. */
export function CreateMenu() {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <CreateTrigger open={open} />
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Create</DropdownMenuLabel>
          {actions.map((action, index) => (
            <DropdownMenuItem
              key={action.label}
              className="animate-in duration-300 fill-mode-backwards fade-in-0 slide-in-from-top-1"
              style={staggerDelay(index + 1, 30)}
              onSelect={() => toast(action.toast, { description: action.description })}
            >
              <HugeiconsIcon icon={action.icon} strokeWidth={1.8} />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CreateTrigger({ open }: { open: boolean }) {
  return (
    <DropdownMenuTrigger asChild>
      <Button
        asChild
        variant="secondary"
        size="icon"
        className="size-10 rounded-full border-0 text-primary hover:bg-accent md:size-12 aria-expanded:bg-accent aria-expanded:text-primary [&_svg:not([class*='size-'])]:size-6 md:[&_svg:not([class*='size-'])]:size-7"
      >
        <motion.button
          type="button"
          aria-label="Create new"
          initial={false}
          animate={open ? "open" : "closed"}
          whileHover={open ? undefined : "hover"}
          whileTap={{ scale: 0.9 }}
          variants={{ closed: { scale: 1 }, open: { scale: 1 }, hover: { scale: 1.06 } }}
          transition={snappy}
        >
          <motion.span
            className="flex"
            variants={{ closed: { rotate: 0 }, open: { rotate: 45 }, hover: { rotate: 90 } }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} />
          </motion.span>
        </motion.button>
      </Button>
    </DropdownMenuTrigger>
  )
}
