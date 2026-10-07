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
import { formatRange } from "@/lib/schedule-time"

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
  | { type: "accept-suggestion"; id: string }
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
    case "clear-highlight":
      return { ...state, highlightedVisitId: null }
    case "dismiss-suggestion":
      return { ...state, suggestions: state.suggestions.filter((s) => s.id !== action.id) }
    case "fill-open-shift":
      return fillOpenShift(state, action.openShiftId, action.caregiverId)
    case "accept-suggestion": {
      const suggestion = state.suggestions.find((s) => s.id === action.id)
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
  }
}

export function isOvertimeRisk(caregiver: Caregiver) {
  return caregiver.weeklyHours / caregiver.weeklyLimit >= OVERTIME_THRESHOLD
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end
}

type ScheduleContextValue = ScheduleState & {
  /** Caregivers after the "All caregivers" filter is applied. */
  visibleCaregivers: Caregiver[]
  visitsByCaregiver: Map<string, Visit[]>
  overtimeCaregivers: Caregiver[]
  /** Total overtime hours the pending suggestions would save. */
  pendingSavings: number
  /** Open shifts the pending suggestions would fill. */
  pendingFills: number
  caregiverById: (id: string) => Caregiver | undefined
  /** Qualified caregivers with no clashing visit, least-loaded first. */
  availableCaregiversFor: (shift: Pick<OpenShift, "start" | "end" | "requirement">) => Caregiver[]
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

const ScheduleContext = React.createContext<ScheduleContextValue | null>(null)

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

  const actions = React.useMemo(() => {
    const nameOf = (id: string) =>
      stateRef.current.caregivers.find((c) => c.id === id)?.name ?? "caregiver"

    const acceptSuggestion = (id: string) => {
      const suggestion = stateRef.current.suggestions.find((s) => s.id === id)
      if (!suggestion) return
      dispatch({ type: "accept-suggestion", id })
      if (suggestion.kind === "reassign") {
        const visit = stateRef.current.visits.find((v) => v.id === suggestion.visitId)
        toast.success(`${visit?.patient ?? "Visit"} moved to ${nameOf(suggestion.toCaregiverId)}`, {
          description: `Saves ${suggestion.savesHours} overtime hours for ${nameOf(suggestion.fromCaregiverId)}.`,
        })
      } else {
        const shift = stateRef.current.openShifts.find((s) => s.id === suggestion.openShiftId)
        toast.success(`Open shift filled by ${nameOf(suggestion.toCaregiverId)}`, {
          description: shift ? `${shift.patient}, ${formatRange(shift.start, shift.end)}` : undefined,
        })
      }
    }

    return {
      setView: (view: ScheduleView) => dispatch({ type: "set-view", view }),
      setFilter: (filter: CaregiverFilter) => dispatch({ type: "set-filter", filter }),
      setSuggestionsOpen: (open: boolean) => dispatch({ type: "set-suggestions-open", open }),
      setPreviewSuggestions: (preview: boolean) => dispatch({ type: "set-preview", preview }),
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
          dispatch({ type: "set-optimizing", optimizing: false })
          // Show the suggestions on the board; the sheet stays closed so it doesn't cover them.
          dispatch({ type: "set-preview", preview: true })
          const count = stateRef.current.suggestions.length
          toast(`${count} ${count === 1 ? "suggestion" : "suggestions"} ready`, {
            description: "Previewed on the schedule.",
            action: {
              label: "Review",
              onClick: () => dispatch({ type: "set-suggestions-open", open: true }),
            },
          })
        }, 1400)
      },
      acceptSuggestion,
      acceptAllSuggestions: () => {
        for (const s of [...stateRef.current.suggestions]) acceptSuggestion(s.id)
        dispatch({ type: "set-suggestions-open", open: false })
      },
      dismissSuggestion: (id: string) => dispatch({ type: "dismiss-suggestion", id }),
      fillOpenShift: (openShiftId: string, caregiverId: string) => {
        const shift = stateRef.current.openShifts.find((s) => s.id === openShiftId)
        if (!shift) return
        dispatch({ type: "fill-open-shift", openShiftId, caregiverId })
        toast.success(`Open shift filled by ${nameOf(caregiverId)}`, {
          description: `${shift.patient}, ${formatRange(shift.start, shift.end)}`,
        })
      },
    }
  }, [])

  const derived = React.useMemo(() => {
    const visitsByCaregiver = new Map<string, Visit[]>()
    for (const c of state.caregivers) visitsByCaregiver.set(c.id, [])
    for (const v of state.visits) visitsByCaregiver.get(v.caregiverId)?.push(v)
    for (const list of visitsByCaregiver.values()) list.sort((a, b) => a.start - b.start)

    const overtimeCaregivers = state.caregivers.filter(isOvertimeRisk)
    const visibleCaregivers = state.caregivers.filter((c) =>
      state.filter === "on-shift" ? c.onShift : state.filter === "overtime" ? isOvertimeRisk(c) : true
    )

    return {
      visitsByCaregiver,
      overtimeCaregivers,
      visibleCaregivers,
      pendingSavings: state.suggestions.reduce(
        (sum, s) => sum + (s.kind === "reassign" ? s.savesHours : 0),
        0
      ),
      pendingFills: state.suggestions.filter((s) => s.kind === "fill-open-shift").length,
      caregiverById: (id: string) => state.caregivers.find((c) => c.id === id),
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
  }, [state.caregivers, state.visits, state.suggestions, state.filter])

  const value = React.useMemo<ScheduleContextValue>(
    () => ({ ...state, ...derived, ...actions }),
    [state, derived, actions]
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}

export function useSchedule() {
  const context = React.useContext(ScheduleContext)
  if (!context) throw new Error("useSchedule must be used within a ScheduleProvider.")
  return context
}
