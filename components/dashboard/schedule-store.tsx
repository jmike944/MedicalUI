"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  caregivers as initialCaregivers,
  openShifts as initialOpenShifts,
  suggestions as initialSuggestions,
  visits as initialVisits,
  OVERTIME_THRESHOLD,
  type Caregiver,
  type OpenShift,
  type Suggestion,
  type Visit,
} from "@/lib/schedule-data"
import { formatDecimal, formatRange } from "@/lib/schedule-time"

export type ScheduleView = "day" | "week"
export type CaregiverFilter = "all" | "on-shift" | "overtime"

type ScheduleState = {
  caregivers: Caregiver[]
  visits: Visit[]
  openShifts: OpenShift[]
  suggestions: Suggestion[]
  view: ScheduleView
  filter: CaregiverFilter
  suggestionsOpen: boolean
  /** Show pending AI suggestions as ghost blocks on the timeline. */
  previewSuggestions: boolean
  optimizing: boolean
  /** Visit that just moved, so the timeline can flash it. */
  highlightedVisitId: string | null
}

type ScheduleAction =
  | { type: "set-view"; view: ScheduleView }
  | { type: "set-filter"; filter: CaregiverFilter }
  | { type: "set-suggestions-open"; open: boolean }
  | { type: "set-preview"; preview: boolean }
  | { type: "set-optimizing"; optimizing: boolean }
  /** The optimizer finished: preview its suggestions on the day board, where ghosts render. */
  | { type: "show-preview" }
  | { type: "accept-suggestion"; id: string }
  | { type: "accept-all-suggestions" }
  | { type: "dismiss-suggestion"; id: string }
  | { type: "fill-open-shift"; openShiftId: string; caregiverId: string }
  | { type: "clear-highlight" }

const initialState: ScheduleState = {
  caregivers: initialCaregivers,
  visits: initialVisits,
  openShifts: initialOpenShifts,
  suggestions: initialSuggestions,
  view: "day",
  filter: "all",
  suggestionsOpen: false,
  previewSuggestions: false,
  optimizing: false,
  highlightedVisitId: null,
}

function addHours(caregivers: Caregiver[], id: string, delta: number) {
  return caregivers.map((c) =>
    c.id === id ? { ...c, weeklyHours: Math.max(0, c.weeklyHours + delta) } : c
  )
}

function fillOpenShift(state: ScheduleState, openShiftId: string, caregiverId: string): ScheduleState {
  const shift = state.openShifts.find((s) => s.id === openShiftId)
  if (!shift) return state
  // The new visit keeps the open shift's id so its block can animate from the open shifts row.
  const visit: Visit = {
    id: shift.id,
    caregiverId,
    patient: shift.patient,
    start: shift.start,
    end: shift.end,
    status: "scheduled",
    service: shift.service,
    address: shift.address,
  }
  return {
    ...state,
    visits: [...state.visits, visit],
    openShifts: state.openShifts.filter((s) => s.id !== openShiftId),
    caregivers: addHours(state.caregivers, caregiverId, shift.end - shift.start),
    suggestions: state.suggestions.filter(
      (s) => !(s.kind === "fill-open-shift" && s.openShiftId === openShiftId)
    ),
    highlightedVisitId: visit.id,
  }
}

function acceptSuggestion(state: ScheduleState, id: string): ScheduleState {
  const suggestion = state.suggestions.find((s) => s.id === id)
  if (!suggestion) return state
  if (suggestion.kind === "fill-open-shift") {
    return fillOpenShift(state, suggestion.openShiftId, suggestion.toCaregiverId)
  }
  const visit = state.visits.find((v) => v.id === suggestion.visitId)
  if (!visit) return state
  const duration = visit.end - visit.start
  let caregivers = addHours(state.caregivers, suggestion.fromCaregiverId, -suggestion.savesHours)
  caregivers = addHours(caregivers, suggestion.toCaregiverId, duration)
  return {
    ...state,
    caregivers,
    visits: state.visits.map((v) =>
      v.id === visit.id ? { ...v, caregiverId: suggestion.toCaregiverId } : v
    ),
    suggestions: state.suggestions.filter(
      (s) => s.id !== suggestion.id && !(s.kind === "reassign" && s.visitId === visit.id)
    ),
    highlightedVisitId: visit.id,
  }
}

/**
 * Accepts every pending suggestion in order. Accepting one can retire an alternative for the same
 * visit or shift, so this also reports which suggestions actually applied.
 */
function acceptAll(state: ScheduleState) {
  const applied: Suggestion[] = []
  let next = state
  for (const suggestion of state.suggestions) {
    const after = acceptSuggestion(next, suggestion.id)
    if (after !== next) applied.push(suggestion)
    next = after
  }
  return { next, applied }
}

function reducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  const next = applyAction(state, action)
  // Nothing left to preview once every suggestion is handled.
  return next.previewSuggestions && next.suggestions.length === 0
    ? { ...next, previewSuggestions: false }
    : next
}

function applyAction(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case "set-view":
      return { ...state, view: action.view }
    case "set-filter":
      return { ...state, filter: action.filter }
    case "set-suggestions-open":
      return { ...state, suggestionsOpen: action.open }
    case "set-preview":
      return { ...state, previewSuggestions: action.preview }
    case "set-optimizing":
      return { ...state, optimizing: action.optimizing }
    case "show-preview":
      return { ...state, optimizing: false, previewSuggestions: true, view: "day" }
    case "clear-highlight":
      return { ...state, highlightedVisitId: null }
    case "dismiss-suggestion":
      return { ...state, suggestions: state.suggestions.filter((s) => s.id !== action.id) }
    case "fill-open-shift":
      return fillOpenShift(state, action.openShiftId, action.caregiverId)
    case "accept-suggestion":
      return acceptSuggestion(state, action.id)
    case "accept-all-suggestions":
      return acceptAll(state).next
  }
}

export function isOvertimeRisk(caregiver: Caregiver) {
  return caregiver.weeklyHours / caregiver.weeklyLimit >= OVERTIME_THRESHOLD
}

function matchesFilter(caregiver: Caregiver, filter: CaregiverFilter) {
  if (filter === "on-shift") return caregiver.onShift
  if (filter === "overtime") return isOvertimeRisk(caregiver)
  return true
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many
}

/** (1.5, 1) → "Saved 1.5 overtime hours and filled 1 open shift." */
function describeApplied(applied: Suggestion[]) {
  let savings = 0
  let fills = 0
  for (const s of applied) {
    if (s.kind === "reassign") savings += s.savesHours
    else fills += 1
  }
  const parts: string[] = []
  if (savings > 0) {
    parts.push(`saved ${formatDecimal(savings)} overtime ${plural(savings, "hour", "hours")}`)
  }
  if (fills > 0) parts.push(`filled ${fills} open ${plural(fills, "shift", "shifts")}`)
  if (parts.length === 0) return undefined
  const sentence = parts.join(" and ")
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`
}

/** The schedule's records and everything derived from them. Changes when visits, shifts or suggestions do. */
export type ScheduleData = {
  caregivers: Caregiver[]
  visits: Visit[]
  openShifts: OpenShift[]
  suggestions: Suggestion[]
  visitsByCaregiver: Map<string, Visit[]>
  overtimeCaregivers: Caregiver[]
  /** Total overtime hours the pending suggestions would save. */
  pendingSavings: number
  /** Open shifts the pending suggestions would fill. */
  pendingFills: number
  caregiverById: (id: string) => Caregiver | undefined
  /** Qualified caregivers with no clashing visit, least-loaded first. */
  availableCaregiversFor: (shift: Pick<OpenShift, "start" | "end" | "requirement">) => Caregiver[]
}

/** How the board is being looked at: view, filter, preview and transient flags. */
export type ScheduleUi = {
  view: ScheduleView
  filter: CaregiverFilter
  suggestionsOpen: boolean
  previewSuggestions: boolean
  optimizing: boolean
  highlightedVisitId: string | null
  /**
   * Caregivers after the "All caregivers" filter is applied. While suggestions are previewed,
   * the caregivers they involve stay listed so every ghost has a row to land on.
   */
  visibleCaregivers: Caregiver[]
}

/** Stable for the provider's lifetime, so components that only act never re-render from state. */
export type ScheduleActions = {
  setView: (view: ScheduleView) => void
  setFilter: (filter: CaregiverFilter) => void
  setSuggestionsOpen: (open: boolean) => void
  setPreviewSuggestions: (preview: boolean) => void
  /** Run the (simulated) optimizer, then preview its suggestions on the board. */
  optimize: () => void
  acceptSuggestion: (id: string) => void
  acceptAllSuggestions: () => void
  dismissSuggestion: (id: string) => void
  fillOpenShift: (openShiftId: string, caregiverId: string) => void
}

/** Accepts closer together than this share one toast (e.g. the review sheet applying a batch one by one). */
const ACCEPT_TOAST_WINDOW_MS = 1500

const ScheduleDataContext = React.createContext<ScheduleData | null>(null)
const ScheduleUiContext = React.createContext<ScheduleUi | null>(null)
const ScheduleActionsContext = React.createContext<ScheduleActions | null>(null)

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const stateRef = React.useRef(state)
  React.useEffect(() => {
    stateRef.current = state
  })

  React.useEffect(() => {
    if (!state.highlightedVisitId) return
    const timeout = window.setTimeout(() => dispatch({ type: "clear-highlight" }), 2400)
    return () => window.clearTimeout(timeout)
  }, [state.highlightedVisitId])

  const optimizeTimeout = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(optimizeTimeout.current), [])

  /** The toast for the latest run of accepts, so follow-ups update it instead of stacking. */
  const acceptToast = React.useRef<{ id: string | number; applied: Suggestion[]; at: number } | null>(
    null
  )

  const actions = React.useMemo<ScheduleActions>(() => {
    const nameOf = (id: string) =>
      stateRef.current.caregivers.find((c) => c.id === id)?.name ?? "caregiver"

    /**
     * Updates that re-render the whole board run as transitions. Menus call these from inside
     * `flushSync` (Radix `onSelect`), so a plain dispatch would block until every row re-renders;
     * as a transition the menu closes first and layout animations get their opening frames.
     */
    const dispatchInTransition = (action: ScheduleAction) =>
      React.startTransition(() => dispatch(action))

    /**
     * One toast per run of accepts. A lone accept says exactly what moved; when more land within
     * the window, the same toast turns into a running summary ("Applied 2 suggestions").
     */
    const announceAccepted = (applied: Suggestion[]) => {
      const now = performance.now()
      const previous = acceptToast.current
      const run =
        previous && now - previous.at < ACCEPT_TOAST_WINDOW_MS
          ? [...previous.applied, ...applied]
          : applied
      const id = run === applied ? undefined : previous?.id
      let toastId: string | number
      if (run.length === 1) {
        const [suggestion] = run
        const { visits, openShifts } = stateRef.current
        if (suggestion.kind === "reassign") {
          const visit = visits.find((v) => v.id === suggestion.visitId)
          toastId = toast.success(
            `${visit?.patient ?? "Visit"} moved to ${nameOf(suggestion.toCaregiverId)}`,
            {
              id,
              description: `Saves ${formatDecimal(suggestion.savesHours)} overtime ${plural(suggestion.savesHours, "hour", "hours")} for ${nameOf(suggestion.fromCaregiverId)}.`,
            }
          )
        } else {
          const shift = openShifts.find((s) => s.id === suggestion.openShiftId)
          toastId = toast.success(`Open shift filled by ${nameOf(suggestion.toCaregiverId)}`, {
            id,
            description: shift ? `${shift.patient}, ${formatRange(shift.start, shift.end)}` : undefined,
          })
        }
      } else {
        toastId = toast.success(
          `Applied ${run.length} ${plural(run.length, "suggestion", "suggestions")}`,
          { id, description: describeApplied(run) }
        )
      }
      acceptToast.current = { id: toastId, applied: run, at: now }
    }

    const setSuggestionsOpen = (open: boolean) => {
      // Clear stale toasts so none sits over the review sheet's footer buttons.
      if (open) toast.dismiss()
      dispatch({ type: "set-suggestions-open", open })
    }

    return {
      setView: (view) => dispatch({ type: "set-view", view }),
      setFilter: (filter) => dispatchInTransition({ type: "set-filter", filter }),
      setSuggestionsOpen,
      setPreviewSuggestions: (preview) => dispatch({ type: "set-preview", preview }),
      optimize: () => {
        if (stateRef.current.optimizing) return
        if (stateRef.current.suggestions.length === 0) {
          toast("Schedule is already optimized", {
            description: "No overtime savings or open shift matches right now.",
          })
          return
        }
        dispatch({ type: "set-optimizing", optimizing: true })
        window.clearTimeout(optimizeTimeout.current)
        optimizeTimeout.current = window.setTimeout(() => {
          // Ghosts only render on the day board, and the rows they land on stay visible under any
          // filter, so the preview is always on screen. The sheet stays closed so it doesn't cover them.
          dispatch({ type: "show-preview" })
          const count = stateRef.current.suggestions.length
          toast(`${count} ${plural(count, "suggestion", "suggestions")} ready`, {
            description: "Previewed on the schedule.",
            action: {
              label: "Review",
              onClick: () => setSuggestionsOpen(true),
            },
          })
        }, 1400)
      },
      acceptSuggestion: (id) => {
        const { suggestions, suggestionsOpen } = stateRef.current
        const suggestion = suggestions.find((s) => s.id === id)
        if (!suggestion) return
        dispatchInTransition({ type: "accept-suggestion", id })
        // An open review sheet confirms each accept inline; a toast would only cover its footer.
        if (!suggestionsOpen) announceAccepted([suggestion])
      },
      acceptAllSuggestions: () => {
        const { applied } = acceptAll(stateRef.current)
        if (applied.length === 0) return
        // Close the sheet right away; the board catches up in a transition behind it.
        dispatch({ type: "set-suggestions-open", open: false })
        dispatchInTransition({ type: "accept-all-suggestions" })
        announceAccepted(applied)
      },
      dismissSuggestion: (id) => dispatch({ type: "dismiss-suggestion", id }),
      fillOpenShift: (openShiftId, caregiverId) => {
        const shift = stateRef.current.openShifts.find((s) => s.id === openShiftId)
        if (!shift) return
        dispatchInTransition({ type: "fill-open-shift", openShiftId, caregiverId })
        toast.success(`Open shift filled by ${nameOf(caregiverId)}`, {
          description: `${shift.patient}, ${formatRange(shift.start, shift.end)}`,
        })
      },
    }
  }, [])

  // Roster lookups only change with caregivers or visits, so filter and suggestion updates
  // keep `caregiverById` / `availableCaregiversFor` stable for downstream memos.
  const roster = React.useMemo(() => {
    const visitsByCaregiver = new Map<string, Visit[]>()
    const byId = new Map<string, Caregiver>()
    for (const c of state.caregivers) {
      visitsByCaregiver.set(c.id, [])
      byId.set(c.id, c)
    }
    for (const v of state.visits) visitsByCaregiver.get(v.caregiverId)?.push(v)
    for (const list of visitsByCaregiver.values()) list.sort((a, b) => a.start - b.start)

    return {
      visitsByCaregiver,
      overtimeCaregivers: state.caregivers.filter(isOvertimeRisk),
      caregiverById: (id: string) => byId.get(id),
      availableCaregiversFor: (shift: Pick<OpenShift, "start" | "end" | "requirement">) =>
        state.caregivers
          .filter(
            (c) =>
              c.qualifications.includes(shift.requirement) &&
              c.weeklyHours + (shift.end - shift.start) <= c.weeklyLimit &&
              !(visitsByCaregiver.get(c.id) ?? []).some((v) => overlaps(v, shift))
          )
          .sort((a, b) => a.weeklyHours / a.weeklyLimit - b.weeklyHours / b.weeklyLimit),
    }
  }, [state.caregivers, state.visits])

  const pending = React.useMemo(() => {
    let savings = 0
    let fills = 0
    const involved = new Set<string>()
    for (const s of state.suggestions) {
      involved.add(s.toCaregiverId)
      if (s.kind === "reassign") {
        savings += s.savesHours
        involved.add(s.fromCaregiverId)
      } else {
        fills += 1
      }
    }
    return { savings, fills, involved }
  }, [state.suggestions])

  const data = React.useMemo<ScheduleData>(
    () => ({
      caregivers: state.caregivers,
      visits: state.visits,
      openShifts: state.openShifts,
      suggestions: state.suggestions,
      ...roster,
      pendingSavings: pending.savings,
      pendingFills: pending.fills,
    }),
    [state.caregivers, state.visits, state.openShifts, state.suggestions, roster, pending]
  )

  const visibleCaregivers = React.useMemo(() => {
    if (state.filter === "all") return state.caregivers
    return state.caregivers.filter(
      (c) =>
        matchesFilter(c, state.filter) ||
        (state.previewSuggestions && pending.involved.has(c.id))
    )
  }, [state.caregivers, state.filter, state.previewSuggestions, pending])

  const ui = React.useMemo<ScheduleUi>(
    () => ({
      view: state.view,
      filter: state.filter,
      suggestionsOpen: state.suggestionsOpen,
      previewSuggestions: state.previewSuggestions,
      optimizing: state.optimizing,
      highlightedVisitId: state.highlightedVisitId,
      visibleCaregivers,
    }),
    [
      state.view,
      state.filter,
      state.suggestionsOpen,
      state.previewSuggestions,
      state.optimizing,
      state.highlightedVisitId,
      visibleCaregivers,
    ]
  )

  return (
    <ScheduleActionsContext value={actions}>
      <ScheduleDataContext value={data}>
        <ScheduleUiContext value={ui}>{children}</ScheduleUiContext>
      </ScheduleDataContext>
    </ScheduleActionsContext>
  )
}

function useRequiredContext<T>(context: React.Context<T | null>, hook: string) {
  const value = React.use(context)
  if (!value) throw new Error(`${hook} must be used within a ScheduleProvider.`)
  return value
}

/** Records and lookups (caregivers, visits, open shifts, suggestions). */
export function useScheduleData() {
  return useRequiredContext(ScheduleDataContext, "useScheduleData")
}

/** View, filter, preview and transient board flags. */
export function useScheduleUi() {
  return useRequiredContext(ScheduleUiContext, "useScheduleUi")
}

/** Stable action callbacks. Components that only dispatch should use this and nothing else. */
export function useScheduleActions() {
  return useRequiredContext(ScheduleActionsContext, "useScheduleActions")
}

/**
 * Everything at once. Convenient, but it re-renders on every store change; prefer
 * `useScheduleData`, `useScheduleUi` and `useScheduleActions` for the slices a component reads.
 */
export function useSchedule(): ScheduleData & ScheduleUi & ScheduleActions {
  const data = useScheduleData()
  const ui = useScheduleUi()
  const actions = useScheduleActions()
  return React.useMemo(() => ({ ...data, ...ui, ...actions }), [data, ui, actions])
}
