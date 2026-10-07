"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Clock01Icon,
  Notification01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

import { useSchedule } from "@/components/dashboard/schedule-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { formatRange, formatTime } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

import { snappy } from "./motion"

type Tone = "attention" | "warning" | "primary"

type Notice = {
  id: string
  icon: typeof Alert02Icon
  tone: Tone
  title: string
  description: string
  time: string
  onOpen: () => void
}

const toneStyles: Record<Tone, string> = {
  attention: "bg-attention text-attention-foreground",
  warning: "bg-warning/15 text-warning-foreground",
  primary: "bg-accent text-accent-foreground",
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 6, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: snappy },
}

/** Builds the three live notices from the schedule, so they track accepted suggestions. */
function useNotices(close: () => void): Notice[] {
  const {
    visits,
    openShifts,
    caregiverById,
    setFilter,
    setPreviewSuggestions,
    setSuggestionsOpen,
  } = useSchedule()

  const irene = visits.find((v) => v.patient === "Irene Foster")
  const ireneCaregiver = irene ? caregiverById(irene.caregiverId) : undefined
  const james = caregiverById("james-carter")
  const hoursLeft = james ? Math.max(0, james.weeklyLimit - james.weeklyHours) : 0
  const shiftCount = openShifts.length

  return [
    {
      id: "irene-authorization",
      icon: Alert02Icon,
      tone: "attention",
      title: "Irene Foster's authorization expires today",
      description: irene
        ? `Renew before her ${formatTime(irene.start)} visit${ireneCaregiver ? ` with ${ireneCaregiver.name}` : ""}.`
        : "Renew before her next visit.",
      time: "8 min ago",
      onOpen: () => {
        close()
        toast("Opened Irene Foster's authorization", {
          description: "Medicaid renewal is ready to submit.",
        })
      },
    },
    {
      id: "james-overtime",
      icon: Clock01Icon,
      tone: "warning",
      title: `James Carter is ${hoursLeft} h from overtime`,
      description: james
        ? `${james.weeklyHours} of ${james.weeklyLimit} h this week. Showing overtime risk.`
        : "Review his remaining visits.",
      time: "24 min ago",
      onOpen: () => {
        close()
        setFilter("overtime")
      },
    },
    {
      id: "open-shifts",
      icon: UserAdd01Icon,
      tone: "primary",
      title:
        shiftCount === 0
          ? "All open shifts are covered"
          : `${shiftCount} open ${shiftCount === 1 ? "shift needs" : "shifts need"} coverage tonight`,
      description:
        shiftCount === 0
          ? "Nice work. Nothing left to fill today."
          : openShifts.map((s) => `${s.patient}, ${formatRange(s.start, s.end)}`).join(" · "),
      time: "1 h ago",
      onOpen: () => {
        close()
        if (shiftCount > 0) {
          setPreviewSuggestions(true)
          setSuggestionsOpen(true)
        }
      },
    },
  ]
}

/** Bell with an unread dot; opens a popover of today's alerts. */
export function NotificationsButton() {
  const [open, setOpen] = React.useState(false)
  const [readIds, setReadIds] = React.useState<ReadonlySet<string>>(() => new Set())
  const [bellScope, animateBell] = useAnimate<HTMLSpanElement>()
  const reduceMotion = useReducedMotion()
  const notices = useNotices(() => setOpen(false))
  const unread = notices.filter((n) => !readIds.has(n.id)).length
  const titleId = React.useId()

  const markRead = (id: string) =>
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  const markAllRead = () => {
    if (unread === 0) return
    setReadIds(new Set(notices.map((n) => n.id)))
    // A small "all clear" ring as the dot pops away.
    if (!reduceMotion) animateBell(bellScope.current, { rotate: [0, -14, 11, -6, 3, 0] }, { duration: 0.6, ease: "easeInOut" })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative size-10 rounded-full text-foreground md:size-12 [&_svg:not([class*='size-'])]:size-6"
        >
          <motion.button
            type="button"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            whileHover="hover"
            whileTap={{ scale: 0.9 }}
            transition={snappy}
          >
            <motion.span
              ref={bellScope}
              className="relative flex"
              style={{ transformOrigin: "50% 8%" }}
              variants={{ hover: { rotate: [0, -16, 13, -9, 5, 0] } }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
            >
              <HugeiconsIcon icon={Notification01Icon} strokeWidth={1.6} aria-hidden />
            </motion.span>
            <AnimatePresence>
              {unread > 0 ? (
                <motion.span
                  key="dot"
                  aria-hidden
                  className="absolute top-[7px] right-[6px] flex size-2.5 rounded-full bg-destructive ring-2 ring-background md:top-[11px] md:right-[8px]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 22 }}
                >
                  <span className="absolute inset-0 animate-ping-slow rounded-full bg-destructive" />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.button>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-labelledby={titleId}
        className="w-[min(23rem,calc(100vw-2rem))] gap-0 p-0"
      >
        <PopoverHeader className="flex-row items-center gap-2 px-4 pt-4 pb-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <PopoverTitle id={titleId}>Notifications</PopoverTitle>
              <AnimatePresence initial={false} mode="popLayout">
                {unread > 0 ? (
                  <motion.span
                    key={unread}
                    initial={{ opacity: 0, y: -6, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.8 }}
                    transition={snappy}
                    className="flex"
                  >
                    <Badge variant="destructive">{unread} new</Badge>
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
            <PopoverDescription className="text-xs">Today at Juniper Home Health</PopoverDescription>
          </div>
          {/* aria-disabled rather than disabled: a disabled button drops focus to <body>
              the moment it disables itself under the keyboard. */}
          <Button
            variant="ghost"
            size="xs"
            className="text-primary aria-disabled:pointer-events-none aria-disabled:opacity-50"
            aria-disabled={unread === 0}
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        </PopoverHeader>
        <Separator />
        <motion.div variants={listVariants} initial="hidden" animate="show">
          <ItemGroup className="gap-1 p-2">
            {notices.map((notice) => {
              const isUnread = !readIds.has(notice.id)
              return (
                <motion.div key={notice.id} role="listitem" variants={rowVariants}>
                  <Item
                    asChild
                    size="sm"
                    className={cn(
                      "cursor-pointer flex-nowrap text-left transition-colors duration-200 hover:bg-muted",
                      isUnread && "bg-muted/60"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        markRead(notice.id)
                        notice.onOpen()
                      }}
                    >
                      <ItemMedia
                        className={cn(
                          "size-9 rounded-full [&_svg:not([class*='size-'])]:size-[18px]",
                          toneStyles[notice.tone]
                        )}
                      >
                        <HugeiconsIcon icon={notice.icon} strokeWidth={1.8} aria-hidden />
                      </ItemMedia>
                      <ItemContent className="min-w-0 gap-0.5">
                        <ItemTitle className="line-clamp-2 w-full">{notice.title}</ItemTitle>
                        <ItemDescription className="line-clamp-2 text-xs">
                          {notice.description}
                        </ItemDescription>
                        <span className="text-xs text-muted-foreground/80">{notice.time}</span>
                      </ItemContent>
                      <span className="mt-1.5 flex size-2 shrink-0 self-start">
                        {isUnread ? <span className="sr-only">Unread</span> : null}
                        <AnimatePresence initial={false}>
                          {isUnread ? (
                            <motion.span
                              aria-hidden
                              className="size-2 rounded-full bg-primary"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 520, damping: 24 }}
                            />
                          ) : null}
                        </AnimatePresence>
                      </span>
                    </button>
                  </Item>
                </motion.div>
              )
            })}
          </ItemGroup>
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}
