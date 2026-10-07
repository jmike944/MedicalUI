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
import { usePointerAwareMenuFocus } from "@/hooks/use-pointer-aware-menu-focus"
import { press, staggerDelay, twist } from "@/lib/motion"

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
  const { triggerRef, contentProps } = usePointerAwareMenuFocus<HTMLButtonElement>()

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <CreateTrigger ref={triggerRef} open={open} />
      <DropdownMenuContent align="end" sideOffset={8} className="w-56" {...contentProps}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Create</DropdownMenuLabel>
          {actions.map((action, index) => (
            <DropdownMenuItem
              key={action.label}
              className="animate-in duration-300 fill-mode-backwards fade-in-0 slide-in-from-top-1"
              style={staggerDelay(index + 1, 30)}
              onSelect={() => toast(action.toast, { description: action.description })}
            >
              <HugeiconsIcon icon={action.icon} strokeWidth={1.8} aria-hidden />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Press feedback is a CSS `scale` on :active, layered under motion's hover transform.
 * Motion's press gesture (`whileTap`) can't be used on a Radix menu trigger: on Enter it
 * fires a synthetic pointerdown that opens the menu just before Radix's own Enter
 * handler toggles it shut again.
 */
function CreateTrigger({ ref, open }: { ref: React.Ref<HTMLButtonElement>; open: boolean }) {
  return (
    <DropdownMenuTrigger ref={ref} asChild>
      <Button
        asChild
        variant="secondary"
        size="icon-xl"
        className="rounded-full border-0 text-primary transition-[background-color,color,box-shadow,scale] duration-150 ease-out hover:bg-accent active:scale-90 aria-expanded:bg-accent aria-expanded:text-primary md:[&_svg:not([class*='size-'])]:size-7"
      >
        <motion.button
          type="button"
          aria-label="Create new"
          initial={false}
          animate={open ? "open" : "closed"}
          whileHover={open ? undefined : "hover"}
          variants={{ closed: { scale: 1 }, open: { scale: 1 }, hover: { scale: 1.06 } }}
          transition={press}
        >
          <motion.span
            className="flex"
            variants={{ closed: { rotate: 0 }, open: { rotate: 45 }, hover: { rotate: 90 } }}
            transition={twist}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} aria-hidden />
          </motion.span>
        </motion.button>
      </Button>
    </DropdownMenuTrigger>
  )
}
