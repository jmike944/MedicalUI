"use client"

import * as React from "react"

import type { VisitStatus } from "@/lib/schedule-data"

/** A legend entry the timeline can spotlight: dims every block that doesn't match. */
export type Spotlight = VisitStatus | "open-shift" | "suggestion"

/*
 * The spotlight lives in a tiny external store rather than React state, so sweeping the pointer
 * across the legend only re-renders the blocks whose "spotlit" answer actually flips, instead of
 * every block on the board.
 */
type SpotlightStore = {
  /** Spotlight locked by toggling a legend entry. */
  getLocked: () => Spotlight | null
  /** Preview wins over the locked spotlight. */
  getActive: () => Spotlight | null
  setLocked: (spotlight: Spotlight | null) => void
  /** Spotlight previewed while a legend entry is hovered or focused. */
  setPreview: (spotlight: Spotlight | null) => void
  subscribe: (listener: () => void) => () => void
}

function createSpotlightStore(): SpotlightStore {
  let locked: Spotlight | null = null
  let preview: Spotlight | null = null
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  return {
    getLocked: () => locked,
    getActive: () => preview ?? locked,
    setLocked: (next) => {
      if (next === locked) return
      locked = next
      emit()
    },
    setPreview: (next) => {
      if (next === preview) return
      preview = next
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const SpotlightContext = React.createContext<SpotlightStore | null>(null)

type IntroRegistry = {
  /** The full entrance has played once; later view switches replay it faster. */
  introPlayed: () => boolean
  markIntroPlayed: () => void
}

const IntroRegistryContext = React.createContext<IntroRegistry | null>(null)

/** UI-only state shared by the schedule card's legend, toolbar and views. */
export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(createSpotlightStore)
  const [registry] = React.useState<IntroRegistry>(() => {
    let played = false
    return {
      introPlayed: () => played,
      markIntroPlayed: () => {
        played = true
      },
    }
  })

  return (
    <SpotlightContext value={store}>
      <IntroRegistryContext value={registry}>{children}</IntroRegistryContext>
    </SpotlightContext>
  )
}

function useSpotlightStore() {
  const store = React.use(SpotlightContext)
  if (!store) throw new Error("Spotlight hooks must be used within a BoardProvider.")
  return store
}

/** Legend actions. Stable for the board's lifetime, so callers never re-render because of them. */
export function useSpotlightActions() {
  const store = useSpotlightStore()
  return React.useMemo(
    () => ({ setSpotlight: store.setLocked, setPreview: store.setPreview }),
    [store]
  )
}

/** The locked spotlight, for the legend's pressed state. */
export function useLockedSpotlight() {
  const store = useSpotlightStore()
  return React.useSyncExternalStore(store.subscribe, store.getLocked, store.getLocked)
}

/** The spotlight currently shown (preview, else locked). */
export function useActiveSpotlight() {
  const store = useSpotlightStore()
  return React.useSyncExternalStore(store.subscribe, store.getActive, store.getActive)
}

/** Whether `kind` is the spotlight on show right now. Re-renders only when that answer flips. */
export function useSpotlightIs(kind: Spotlight) {
  const store = useSpotlightStore()
  const getSnapshot = React.useCallback(() => store.getActive() === kind, [store, kind])
  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
}

/**
 * Whether something matching `kinds` stays lit under the current spotlight. Subscribes to the
 * derived boolean, so the caller only re-renders when its own answer changes.
 */
export function useSpotlit(...kinds: Spotlight[]) {
  const store = useSpotlightStore()
  const key = kinds.join(" ")
  const getSnapshot = React.useCallback(() => {
    const active = store.getActive()
    return active === null || key.split(" ").includes(active)
  }, [store, key])
  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
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
  const registry = React.use(IntroRegistryContext)
  if (!registry) throw new Error("IntroProvider must be used within a BoardProvider.")
  const [tempo] = React.useState(() => (registry.introPlayed() ? 0.4 : 1))
  const [active, setActive] = React.useState(true)

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActive(false)
      registry.markIntroPlayed()
    }, duration * tempo)
    return () => window.clearTimeout(timeout)
  }, [duration, tempo, registry])

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
      tempo,
      at: (delay: number, otherwise = 0) => (active ? delay * tempo : otherwise),
    }),
    [active, tempo]
  )
}
