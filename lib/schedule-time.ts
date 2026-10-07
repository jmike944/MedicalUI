import { DAY_END, DAY_START } from "@/lib/schedule-data"

const DAY_SPAN = DAY_END - DAY_START

/** Left offset of an hour on the day timeline, as a percentage of its width. */
export function hourToPercent(hour: number) {
  return ((hour - DAY_START) / DAY_SPAN) * 100
}

/** Width of a time span on the day timeline, as a percentage of its width. */
export function spanToPercent(start: number, end: number) {
  return ((end - start) / DAY_SPAN) * 100
}

/** Whole hours shown as columns on the day timeline: 7, 8, … 18. */
export const timelineHours = Array.from({ length: DAY_SPAN }, (_, i) => DAY_START + i)

function split(hour: number) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return { h, m, period: h >= 12 ? "PM" : "AM", h12: ((h + 11) % 12) + 1 }
}

/** 7 → "7 AM", 13 → "1 PM". */
export function formatHourLabel(hour: number) {
  const { h12, period } = split(hour)
  return `${h12} ${period}`
}

/** 10.75 → "10:45". 24h clock, used for the "now" marker. */
export function formatClock(hour: number) {
  const { h, m } = split(hour)
  return `${h}:${String(m).padStart(2, "0")}`
}

/** 13.5 → "1:30 PM", 16 → "4 PM". */
export function formatTime(hour: number) {
  const { h12, m, period } = split(hour)
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`
}

/** (16, 18) → "4 to 6 PM"; (11, 13) → "11 AM to 1 PM". Matches the design's open shift copy. */
export function formatRange(start: number, end: number) {
  const a = split(start)
  const b = split(end)
  const startText = a.m === 0 ? `${a.h12}` : `${a.h12}:${String(a.m).padStart(2, "0")}`
  return a.period === b.period
    ? `${startText} to ${formatTime(end)}`
    : `${formatTime(start)} to ${formatTime(end)}`
}

/** 1.5 → "1.5 h", 2 → "2 h". */
export function formatHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`
}
