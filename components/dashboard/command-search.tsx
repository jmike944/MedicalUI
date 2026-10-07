"use client"

import * as React from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  ArrowDown01Icon,
  ArrowTurnBackwardIcon,
  ArrowUp01Icon,
  Clock01Icon,
  Invoice01Icon,
  Search01Icon,
  SparklesIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { PersonAvatar } from "@/components/dashboard/person-avatar"
import { isOvertimeRisk, useSchedule } from "@/components/dashboard/schedule-store"
import { staggerDelay } from "@/components/dashboard/top-bar/motion"
import { useRestoreFocus } from "@/components/dashboard/top-bar/use-restore-focus"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { OpenShift, Visit } from "@/lib/schedule-data"
import { formatRange, formatTime } from "@/lib/schedule-time"
import { cn } from "@/lib/utils"

const CLAIMS = [
  { id: "CLM-20931", payer: "Medicaid", status: "Pending review", patient: "Irene Foster" },
  { id: "CLM-20928", payer: "Medicare Part A", status: "Submitted", patient: "Dorothy Nguyen" },
  { id: "CLM-20917", payer: "Aetna", status: "Needs resubmission", patient: "Joseph Ramirez" },
] as const

type PatientResult = { name: string; times: string; detail: string }

const WORD_SPLIT = /[^a-z0-9']+/

/**
 * Word-prefix matching against an item's keywords only (values are ids), so "car" finds
 * Carter and Carlos rather than every row that happens to contain those letters.
 */
function filterByKeywords(_value: string, search: string, keywords?: string[]) {
  const haystack = (keywords ?? []).join(" ").toLowerCase()
  const terms = search.toLowerCase().split(WORD_SPLIT).filter(Boolean)
  if (terms.length === 0) return 1
  const words = haystack.split(WORD_SPLIT)
  if (!terms.every((term) => words.some((word) => word.startsWith(term)))) return 0
  return haystack.startsWith(terms.join(" ")) ? 1 : 0.8
}

/** One row per patient across visits and open shifts, with every time they're seen today. */
function collectPatients(
  visits: Visit[],
  openShifts: OpenShift[],
  caregiverName: (id: string) => string | undefined
): PatientResult[] {
  const byName = new Map<string, { starts: number[]; detail: string }>()
  const add = (name: string, start: number, detail: string) => {
    const entry = byName.get(name)
    if (entry) entry.starts.push(start)
    else byName.set(name, { starts: [start], detail })
  }
  for (const v of visits) add(v.patient, v.start, `${v.service} · ${caregiverName(v.caregiverId) ?? "Unassigned"}`)
  for (const s of openShifts) add(s.patient, s.start, `${s.service} · Open shift, ${formatRange(s.start, s.end)}`)
  return [...byName.entries()]
    .map(([name, { starts, detail }]) => ({
      name,
      detail,
      times: starts
        .sort((a, b) => a - b)
        .map(formatTime)
        .join(" · "),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Global ⌘K palette: quick actions, caregivers, patients and claims. Rows cascade in on open
 * and a single highlight glides between them as the selection moves.
 */
export function CommandSearch({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onCloseAutoFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (query: string) => void
  onCloseAutoFocus?: (event: Event) => void
}) {
  const {
    caregivers,
    visits,
    openShifts,
    suggestions,
    overtimeCaregivers,
    optimizing,
    caregiverById,
    optimize,
    setFilter,
    setPreviewSuggestions,
    setSuggestionsOpen,
  } = useSchedule()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [selected, setSelected] = React.useState("")
  const focusReturn = useRestoreFocus()

  const patients = React.useMemo(
    () => collectPatients(visits, openShifts, (id) => caregiverById(id)?.name),
    [visits, openShifts, caregiverById]
  )

  const run = (action: () => void) => {
    onOpenChange(false)
    action()
  }

  let index = 0
  const rowMotion = () => ({
    className:
      "isolate animate-in duration-300 ease-out fill-mode-backwards fade-in-0 slide-in-from-bottom-2 data-selected:bg-transparent [&>svg:last-child]:hidden",
    style: staggerDelay(index++, 22),
  })
  const highlight = (value: string) =>
    selected === value ? (
      <motion.span
        layoutId="command-search-highlight"
        aria-hidden
        className="absolute inset-0 -z-10 rounded-2xl bg-muted"
        transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.6 }}
      />
    ) : null

  const quickActions = [
    {
      value: "action-optimize",
      label: "Optimize today's schedule",
      icon: AiMagicIcon,
      keywords: ["ai", "copilot", "overtime", "balance"],
      trailing: optimizing ? (
        <Spinner className="text-primary" />
      ) : (
        <CommandShortcut>AI</CommandShortcut>
      ),
      disabled: optimizing,
      onSelect: optimize,
    },
    {
      value: "action-review-suggestions",
      label: "Review AI suggestions",
      icon: SparklesIcon,
      keywords: ["copilot", "suggestions", "accept"],
      trailing: suggestions.length > 0 ? <Badge variant="secondary">{suggestions.length}</Badge> : null,
      disabled: false,
      onSelect: () => {
        setPreviewSuggestions(true)
        setSuggestionsOpen(true)
      },
    },
    {
      value: "action-overtime-risk",
      label: "Show overtime risk",
      icon: Clock01Icon,
      keywords: ["filter", "hours", "overtime"],
      trailing:
        overtimeCaregivers.length > 0 ? (
          <Badge variant="secondary">{overtimeCaregivers.length}</Badge>
        ) : null,
      disabled: false,
      onSelect: () => {
        setFilter("overtime")
        toast("Showing caregivers at overtime risk", {
          description: `${overtimeCaregivers.length} at 90% or more of their weekly hours.`,
        })
      },
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] translate-y-0 gap-0 overflow-hidden rounded-4xl! p-0 shadow-2xl duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:slide-in-from-top-4 sm:max-w-xl"
        onOpenAutoFocus={(event) => {
          focusReturn.remember()
          event.preventDefault()
          const input = inputRef.current
          if (!input) return
          input.focus()
          // Keep the caret after anything typed into the header field.
          input.setSelectionRange(input.value.length, input.value.length)
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event)
          focusReturn.restore(event)
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search CareOps</DialogTitle>
          <DialogDescription>
            Search patients, caregivers and claims, or run a quick action.
          </DialogDescription>
        </DialogHeader>
        <Command
          loop
          filter={filterByKeywords}
          value={selected}
          onValueChange={setSelected}
          className="rounded-none bg-transparent p-1.5"
        >
          <CommandInput
            ref={inputRef}
            value={query}
            onValueChange={onQueryChange}
            placeholder="Search patients, caregivers, claims…"
            className="text-[15px]"
          />
          <CommandList className="max-h-[min(26rem,60vh)] px-0.5 pt-1.5">
            <CommandEmpty className="py-0">
              <Empty className="gap-2 p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="rounded-full">
                    <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">No matches</EmptyTitle>
                  <EmptyDescription>
                    Nothing matches “{query}”. Try a patient, caregiver or claim number.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CommandEmpty>

            <CommandGroup heading="Quick actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.value}
                  value={action.value}
                  keywords={[action.label, ...action.keywords]}
                  disabled={action.disabled}
                  onSelect={() => run(action.onSelect)}
                  {...rowMotion()}
                >
                  {highlight(action.value)}
                  <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <HugeiconsIcon icon={action.icon} strokeWidth={1.8} />
                  </span>
                  <span className="flex-1 truncate">{action.label}</span>
                  {action.trailing}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Caregivers">
              {caregivers.map((caregiver) => {
                const value = `caregiver-${caregiver.id}`
                const atRisk = isOvertimeRisk(caregiver)
                return (
                  <CommandItem
                    key={caregiver.id}
                    value={value}
                    keywords={[caregiver.name, caregiver.role]}
                    onSelect={() =>
                      run(() =>
                        toast(`Opened ${caregiver.name}'s profile`, {
                          description: `${caregiver.role} · ${caregiver.weeklyHours} of ${caregiver.weeklyLimit} h this week`,
                        })
                      )
                    }
                    {...rowMotion()}
                  >
                    {highlight(value)}
                    <PersonAvatar name={caregiver.name} src={caregiver.avatar} className="size-7" />
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="truncate">{caregiver.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{caregiver.role}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums text-muted-foreground",
                        atRisk && "text-warning-foreground"
                      )}
                    >
                      {caregiver.weeklyHours}/{caregiver.weeklyLimit} h
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandGroup heading="Patients">
              {patients.map((patient) => {
                const value = `patient-${patient.name}`
                return (
                  <CommandItem
                    key={patient.name}
                    value={value}
                    keywords={[patient.name]}
                    onSelect={() =>
                      run(() =>
                        toast(`Opened ${patient.name}'s chart`, {
                          description: `${patient.detail} · ${patient.times}`,
                        })
                      )
                    }
                    {...rowMotion()}
                  >
                    {highlight(value)}
                    <span className="flex size-7 items-center justify-center rounded-full bg-panel text-muted-foreground">
                      <HugeiconsIcon icon={UserIcon} strokeWidth={1.8} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{patient.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{patient.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {patient.times}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandGroup heading="Claims">
              {CLAIMS.map((claim) => {
                const value = `claim-${claim.id}`
                return (
                  <CommandItem
                    key={claim.id}
                    value={value}
                    keywords={[claim.id, claim.payer, claim.status, claim.patient]}
                    onSelect={() =>
                      run(() =>
                        toast(`Opened claim ${claim.id}`, {
                          description: `${claim.patient} · ${claim.payer} · ${claim.status}`,
                        })
                      )
                    }
                    {...rowMotion()}
                  >
                    {highlight(value)}
                    <span className="flex size-7 items-center justify-center rounded-full bg-panel text-muted-foreground">
                      <HugeiconsIcon icon={Invoice01Icon} strokeWidth={1.8} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">
                        {claim.id} · {claim.payer} · {claim.status}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{claim.patient}</span>
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <Separator />
        <div className="flex items-center gap-4 px-5 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Kbd>
              <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
            </Kbd>
            <Kbd>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
            </Kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>
              <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
            </Kbd>
            Open
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>Esc</Kbd>
            Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
