"use client"

import * as React from "react"

import type { VisitStatus } from "@/lib/schedule-data"

/** A legend entry the timeline can spotlight: dims every block that doesn't match. */
export type Spotlight = VisitStatus | "open-shift" | "suggestion"

type BoardContextValue = {
  /** Spotlight locked by toggling a legend entry. */
  spotlight: Spotlight | null
  setSpotlight: (spotlight: Spotlight | null) => void
  /** Spotlight previewed while a legend entry is hovered or focused. */
  setPreview: (spotlight: Spotlight | null) => void
  /** Preview wins over the locked spotlight. */
  activeSpotlight: Spotlight | null
  /** The full entrance has played once; later view switches replay it faster. */
  introPlayed: boolean
  markIntroPlayed: () => void
}

const BoardContext = React.createContext<BoardContextValue | null>(null)

/** UI-only state shared by the schedule card's legend and timeline. */
export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [spotlight, setSpotlight] = React.useState<Spotlight | null>(null)
  const [preview, setPreview] = React.useState<Spotlight | null>(null)
  const [introPlayed, setIntroPlayed] = React.useState(false)
  const markIntroPlayed = React.useCallback(() => setIntroPlayed(true), [])

  const value = React.useMemo<BoardContextValue>(
    () => ({
      spotlight,
      setSpotlight,
      setPreview,
      activeSpotlight: preview ?? spotlight,
      introPlayed,
      markIntroPlayed,
    }),
    [spotlight, preview, introPlayed, markIntroPlayed]
  )

  return <BoardContext value={value}>{children}</BoardContext>
}

export function useBoard() {
  const context = React.use(BoardContext)
  if (!context) throw new Error("useBoard must be used within a BoardProvider.")
  return context
}

type IntroValue = {
  /** True while a view plays its entrance choreography. */
  active: boolean
  /** Multiplier for entrance delays: 1 on first paint, shorter when switching views. */
  tempo: number
}

const IntroContext = React.createContext<IntroValue>({ active: false, tempo: 1 })

/**
 * Marks the first moments after a view mounts, so blocks reveal once instead of on every
 * re-render. The first view on the page gets the full cascade; Day/Week switches get a quick one.
 */
export function IntroProvider({
  children,
  duration = 2000,
}: {
  children: React.ReactNode
  duration?: number
}) {
  const { introPlayed, markIntroPlayed } = useBoard()
  const [tempo] = React.useState(introPlayed ? 0.4 : 1)
  const [active, setActive] = React.useState(true)

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActive(false)
      markIntroPlayed()
    }, duration * tempo)
    return () => window.clearTimeout(timeout)
  }, [duration, tempo, markIntroPlayed])

  const value = React.useMemo(() => ({ active, tempo }), [active, tempo])
  return <IntroContext value={value}>{children}</IntroContext>
}

/** Whether the surrounding view is still playing its entrance. */
export function useIntro() {
  return React.use(IntroContext).active
}

/**
 * Entrance timing helper: `at(delay)` scales a choreography delay by the current tempo while the
 * entrance plays, and returns `otherwise` (default 0) afterwards.
 */
export function useIntroTiming() {
  const { active, tempo } = React.use(IntroContext)
  return React.useMemo(
    () => ({
      intro: active,
      at: (delay: number, otherwise = 0) => (active ? delay * tempo : otherwise),
    }),
    [active, tempo]
  )
}
