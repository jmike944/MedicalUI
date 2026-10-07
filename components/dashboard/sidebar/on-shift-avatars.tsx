"use client"

import * as React from "react"
import { motion } from "motion/react"
import { toast } from "sonner"

import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { bouncy, snappy } from "@/lib/motion"
import { AGENCY, type Caregiver } from "@/lib/schedule-data"

const SPREAD = 5

/**
 * Overlapping faces of caregivers on shift. Faces pop in one after another; on
 * hover the stack fans out and the face under the pointer lifts.
 */
export function OnShiftAvatars({
  caregivers,
  remaining,
  delay,
}: {
  caregivers: Caregiver[]
  /** On-shift caregivers not shown as faces. */
  remaining: number
  delay: number
}) {
  const [spread, setSpread] = React.useState(false)
  const [lifted, setLifted] = React.useState<string | null>(null)

  return (
    <AvatarGroup
      className="w-fit"
      onPointerEnter={() => setSpread(true)}
      onPointerLeave={() => {
        setSpread(false)
        setLifted(null)
      }}
      onFocus={() => setSpread(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setSpread(false)
      }}
    >
      {caregivers.map((caregiver, index) => {
        const isLifted = lifted === caregiver.id
        return (
          <motion.span
            key={caregiver.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...bouncy, delay: delay + index * 0.06 }}
            className="relative flex rounded-full"
            style={{ zIndex: isLifted ? 10 : index }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  aria-label={`${caregiver.name}, ${caregiver.role}, on shift`}
                  onClick={() =>
                    toast(`Opened ${caregiver.name}'s profile`, {
                      description: `${caregiver.role} · On shift · ${caregiver.weeklyHours} of ${caregiver.weeklyLimit} h this week`,
                    })
                  }
                  onPointerEnter={() => setLifted(caregiver.id)}
                  onPointerLeave={() => setLifted(null)}
                  onFocus={() => setLifted(caregiver.id)}
                  onBlur={() => setLifted(null)}
                  animate={{
                    x: spread ? index * SPREAD : 0,
                    y: isLifted ? -4 : 0,
                    scale: isLifted ? 1.1 : 1,
                  }}
                  transition={snappy}
                  className="flex cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                >
                  <PersonAvatar
                    name={caregiver.name}
                    src={caregiver.avatar}
                    className="size-9 ring-2 ring-sidebar"
                  />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                {caregiver.name} · {caregiver.role}
              </TooltipContent>
            </Tooltip>
          </motion.span>
        )
      })}
      {remaining > 0 ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...bouncy, delay: delay + caregivers.length * 0.06 }}
          className="relative flex rounded-full"
          style={{ zIndex: caregivers.length }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                aria-label={`${remaining} more caregivers on shift`}
                onClick={() =>
                  toast(`${AGENCY.caregiversOnShift} caregivers on shift`, {
                    description: `${caregivers.map((caregiver) => caregiver.name.split(" ")[0]).join(", ")} and ${remaining} more are working right now.`,
                  })
                }
                animate={{ x: spread ? caregivers.length * SPREAD : 0 }}
                transition={snappy}
                className="flex cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              >
                <AvatarGroupCount className="size-9 bg-panel text-[13px] text-sidebar-foreground ring-sidebar">
                  +<AnimatedNumber value={remaining} delay={delay} duration={0.8} />
                </AvatarGroupCount>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {remaining} more on shift
            </TooltipContent>
          </Tooltip>
        </motion.span>
      ) : null}
    </AvatarGroup>
  )
}
