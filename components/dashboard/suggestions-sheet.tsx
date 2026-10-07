"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDataTransferHorizontalIcon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SparklesIcon,
  Tick02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Variants } from "motion/react"

import { COPILOT_CTA_SELECTOR } from "@/components/dashboard/ai-copilot-card"
import { describeSuggestions } from "@/components/dashboard/cards/copilot-copy"
import { HatchedCircle } from "@/components/dashboard/cards/hatched-circle"
import { SparkleBurst } from "@/components/dashboard/cards/sparkle-burst"
import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { useSchedule } from "@/components/dashboard/schedule-store"
import { useRestoreFocus } from "@/components/dashboard/top-bar/use-restore-focus"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import type { Suggestion } from "@/lib/schedule-data"
import { formatHours, formatRange } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

type ExitKind = "accept" | "dismiss"

/** How long an accepted card shows its check before the sheet gets out of the way. */
const ACCEPT_FLASH_MS = 560
/** SheetContent slides out over 200ms; wait for it so the board is clear when the moves start. */
const SHEET_EXIT_MS = 240
/** Gap between Accept all's moves, so each block's glide and highlight reads on its own. */
const ACCEPT_STAGGER_MS = 160
/** Window after opening in which focus pulled outside is another overlay closing, not the user. */
const OPEN_SETTLE_MS = 600

const cardVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 340, damping: 30, delay: 0.12 + index * 0.08 },
  }),
  // Dismissed cards fade out quickly in place, so they're gone before the next card slides up.
  exit: (kind: ExitKind) =>
    kind === "dismiss"
      ? {
          opacity: 0,
          x: -20,
          scale: 0.97,
          transition: { duration: 0.2, ease: [0.4, 0, 1, 1], opacity: { duration: 0.15 } },
        }
      : {
          opacity: 0,
          scale: 0.92,
          y: -10,
          filter: "blur(4px)",
          transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
        },
}

function focusable(root: HTMLElement | null, selector: string) {
  return Array.from(root?.querySelectorAll<HTMLElement>(selector) ?? []).filter(
    (el) => !el.closest("[inert]")
  )
}

/**
 * The AI Copilot review panel. It's non-modal and has no scrim: suggestions are previewed on
 * the board (the "Show on schedule" switch), and accepted ones play out there, so the board
 * must stay visible. Whatever opened it gets focus back when it closes.
 */
export function SuggestionsSheet() {
  const {
    suggestions,
    suggestionsOpen,
    previewSuggestions,
    pendingSavings,
    pendingFills,
    setSuggestionsOpen,
    setPreviewSuggestions,
    acceptSuggestion,
    dismissSuggestion,
  } = useSchedule()
  const reduceMotion = useReducedMotion()
  const focusReturn = useRestoreFocus()
  const [accepting, setAccepting] = React.useState<string[]>([])
  const [exitKind, setExitKind] = React.useState<ExitKind>("accept")
  const timeouts = React.useRef<number[]>([])
  const listRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const lastFocused = React.useRef<HTMLElement | null>(null)
  const openedAt = React.useRef(0)
  const switchId = React.useId()

  React.useEffect(() => {
    const pending = timeouts.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const busy = accepting.length > 0

  function after(ms: number, run: () => void) {
    timeouts.current.push(window.setTimeout(run, ms))
  }

  /**
   * Accepted suggestions play out on the board, so: flash the check on each card, slide the
   * sheet away, then apply the moves one at a time so every glide is visible.
   */
  function commit(ids: string[]) {
    if (ids.length === 0) return
    setAccepting((current) => [...current, ...ids])
    const flash = reduceMotion ? 0 : ACCEPT_FLASH_MS
    const exit = reduceMotion ? 0 : SHEET_EXIT_MS
    const stagger = reduceMotion ? 0 : ACCEPT_STAGGER_MS
    after(flash, () => setSuggestionsOpen(false))
    ids.forEach((id, index) =>
      after(flash + exit + index * stagger, () => {
        setExitKind("accept")
        acceptSuggestion(id)
        setAccepting((current) => current.filter((x) => x !== id))
      })
    )
  }

  function accept(id: string) {
    if (!accepting.includes(id)) commit([id])
  }

  function acceptAll() {
    commit(suggestions.map((s) => s.id).filter((id) => !accepting.includes(id)))
  }

  function dismiss(id: string, index: number) {
    setExitKind("dismiss")
    dismissSuggestion(id)
    // The dismissed card (and the focused button in it) is leaving: move on to the next one.
    window.requestAnimationFrame(() => {
      const accepts = focusable(listRef.current, "[data-suggestion-accept]")
      const next = accepts[Math.min(index, accepts.length - 1)] ?? closeRef.current
      next?.focus({ preventScroll: true })
    })
  }

  function handleOpenAutoFocus() {
    openedAt.current = performance.now()
    lastFocused.current = null
    focusReturn.remember()
  }

  function handleFocusOutside(event: Event) {
    // Non-modal, so focus may leave; the panel stays open until it is closed.
    event.preventDefault()
    // An overlay that closed as this one opened (the ⌘K palette) is handing focus back to its
    // own opener. Adopt that element as the place to return to, and keep focus in the panel.
    if (performance.now() - openedAt.current > OPEN_SETTLE_MS) return
    focusReturn.remember()
    lastFocused.current?.focus({ preventScroll: true })
  }

  function handleCloseAutoFocus(event: Event) {
    // Non-modal: if focus already moved elsewhere on the page, leave it there.
    const active = document.activeElement
    if (active && active !== document.body) {
      event.preventDefault()
      return
    }
    focusReturn.restore(event)
    if (event.defaultPrevented) return
    // The opener is gone (a toast, or a ghost block that was just accepted): use the copilot card.
    const cta = document.querySelector<HTMLElement>(COPILOT_CTA_SELECTOR)
    if (!cta) return
    event.preventDefault()
    cta.focus({ preventScroll: true })
  }

  return (
    <Sheet open={suggestionsOpen} onOpenChange={setSuggestionsOpen} modal={false}>
      <SheetContent
        side="right"
        className="w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        onFocus={(event) => {
          lastFocused.current = event.target
        }}
        // A side panel, not a dialog over the page: working on the board leaves it open.
        onPointerDownOutside={(event) => event.preventDefault()}
        onFocusOutside={handleFocusOutside}
      >
        <SheetHeader className="gap-3 pb-5">
          <motion.span
            aria-hidden
            className="flex size-11 items-center justify-center rounded-full bg-copilot text-primary-foreground"
            initial={{ scale: 0.5, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.1 }}
          >
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.8} className="size-5" />
          </motion.span>
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-xl">AI Copilot suggestions</SheetTitle>
            <SheetDescription className="text-[15px]">
              {suggestions.length > 0
                ? describeSuggestions(pendingSavings, pendingFills)
                : "Nothing to review right now."}
            </SheetDescription>
          </div>
          <label
            htmlFor={switchId}
            className="mt-2 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-muted px-4 py-3"
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">Show on schedule</span>
              <span className="text-muted-foreground">Preview changes as dashed blocks.</span>
            </span>
            <Switch
              id={switchId}
              checked={previewSuggestions && suggestions.length > 0}
              onCheckedChange={setPreviewSuggestions}
              disabled={suggestions.length === 0}
            />
          </label>
        </SheetHeader>

        <Separator />

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col p-6">
            <ItemGroup ref={listRef} className="relative gap-3">
              <AnimatePresence mode="popLayout" custom={exitKind}>
                {suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    accepting={accepting.includes(suggestion.id)}
                    disabled={busy}
                    onAccept={() => accept(suggestion.id)}
                    onDismiss={() => dismiss(suggestion.id, index)}
                  />
                ))}
              </AnimatePresence>
            </ItemGroup>

            {suggestions.length === 0 ? <CaughtUpState /> : null}
          </div>
        </ScrollArea>

        <Separator />

        <SheetFooter className="mt-0 flex-row justify-end gap-2 py-4">
          <SheetClose asChild>
            <Button ref={closeRef} variant="outline" size="lg">
              Close
            </Button>
          </SheetClose>
          <Button size="lg" onClick={acceptAll} disabled={suggestions.length === 0 || busy}>
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
            Accept all
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SuggestionCard({
  suggestion,
  index,
  accepting,
  disabled,
  onAccept,
  onDismiss,
  ref,
}: {
  suggestion: Suggestion
  index: number
  accepting: boolean
  disabled: boolean
  onAccept: () => void
  onDismiss: () => void
  ref?: React.Ref<HTMLDivElement>
}) {
  const reassign = suggestion.kind === "reassign"
  // Leaving cards stay in the DOM while they animate out; keep their buttons out of reach.
  const isPresent = useIsPresent()

  return (
    <Item
      asChild
      role="listitem"
      variant="outline"
      className="group/suggestion relative gap-x-3 gap-y-3.5 overflow-hidden rounded-3xl bg-card p-4"
    >
      <motion.div
        ref={ref}
        layout
        inert={!isPresent}
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        aria-busy={accepting}
      >
        <ItemMedia>
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-300 group-hover/suggestion:rotate-[-8deg]",
              !reassign && "bg-in-progress text-in-progress-foreground"
            )}
          >
            <HugeiconsIcon
              icon={reassign ? ArrowDataTransferHorizontalIcon : UserAdd01Icon}
              strokeWidth={1.8}
              className="size-5"
            />
          </span>
        </ItemMedia>
        <ItemContent className="gap-1">
          <ItemTitle className="line-clamp-2 text-[15px]">{suggestion.title}</ItemTitle>
          <ItemDescription>{suggestion.description}</ItemDescription>
        </ItemContent>

        <SuggestionFlow suggestion={suggestion} />

        <ItemFooter className="flex-wrap">
          <div className="flex flex-wrap items-center gap-1.5">
            {reassign ? (
              <Badge variant="secondary" className="h-6 px-2.5">
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} data-icon="inline-start" />
                Saves {formatHours(suggestion.savesHours)} overtime
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-6 px-2.5">
                <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
                Fills open shift
              </Badge>
            )}
          </div>
          <ItemActions className="ml-auto gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              disabled={disabled}
              aria-label={`Dismiss: ${suggestion.title}`}
            >
              Dismiss
            </Button>
            <Button asChild size="sm">
              <motion.button
                type="button"
                data-suggestion-accept=""
                aria-label={`Accept: ${suggestion.title}`}
                onClick={onAccept}
                disabled={disabled}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
              >
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
                Accept
              </motion.button>
            </Button>
          </ItemActions>
        </ItemFooter>

        <AnimatePresence>
          {accepting ? (
            <motion.div
              key="accepted"
              aria-hidden
              className="absolute inset-0 z-10 flex items-center justify-center bg-accent/85 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.span
                className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
                initial={{ scale: 0.3, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 17 }}
              >
                <SparkleBurst />
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.4} className="size-6" />
              </motion.span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </Item>
  )
}

/** Who the work moves from and to, with the visit time. */
function SuggestionFlow({ suggestion }: { suggestion: Suggestion }) {
  const { caregiverById, visits, openShifts } = useSchedule()
  const to = caregiverById(suggestion.toCaregiverId)

  let from: React.ReactNode
  let time: string | null = null
  if (suggestion.kind === "reassign") {
    const caregiver = caregiverById(suggestion.fromCaregiverId)
    const visit = visits.find((v) => v.id === suggestion.visitId)
    time = visit ? formatRange(visit.start, visit.end) : null
    from = caregiver ? (
      <FlowPerson label={caregiver.name}>
        <PersonAvatar name={caregiver.name} src={caregiver.avatar} size="lg" />
      </FlowPerson>
    ) : null
  } else {
    const shift = openShifts.find((s) => s.id === suggestion.openShiftId)
    time = shift ? formatRange(shift.start, shift.end) : null
    from = (
      <FlowPerson label={shift ? shift.patient : "Open shift"}>
        <HatchedCircle />
      </FlowPerson>
    )
  }

  return (
    <div className="flex basis-full items-center gap-2 rounded-2xl bg-muted/70 px-3 py-2.5">
      {from}
      <div className="relative flex flex-1 items-center justify-center" aria-hidden>
        <motion.span
          className="h-px w-full origin-left bg-primary/30"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
        />
        <span className="absolute flex size-7 items-center justify-center rounded-full bg-card text-primary shadow-xs ring-1 ring-border transition-transform duration-300 group-hover/suggestion:translate-x-1.5">
          <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
        </span>
      </div>
      {to ? (
        <FlowPerson label={to.name}>
          <PersonAvatar name={to.name} src={to.avatar} size="lg" />
        </FlowPerson>
      ) : null}
      {time ? (
        <Badge variant="outline" className="ml-1 h-6 shrink-0 bg-card px-2.5">
          {time}
        </Badge>
      ) : null}
    </div>
  )
}

function FlowPerson({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
      {children}
      <span className="w-full truncate text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function CaughtUpState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.15 }}
    >
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="relative size-14 rounded-full bg-accent text-accent-foreground"
          >
            <SparkleBurst />
            <motion.span
              className="flex"
              initial={{ scale: 0, rotate: -60 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.2 }}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} />
            </motion.span>
          </EmptyMedia>
          <EmptyTitle>You&apos;re all caught up</EmptyTitle>
          <EmptyDescription>No pending suggestions. Run the optimizer again after schedule changes.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </motion.div>
  )
}
