import type { CaregiverRole } from "@/lib/schedule-data"
import { formatDecimal } from "@/lib/schedule-time"

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many
}

/**
 * One-line summary of what the pending suggestions would do:
 * (1.5, 1) → "Save 1.5 overtime hours and fill 1 open shift."
 */
export function describeSuggestions(savings: number, fills: number) {
  const parts: string[] = []
  if (savings > 0) {
    parts.push(`save ${formatDecimal(savings)} overtime ${plural(savings, "hour", "hours")}`)
  }
  if (fills > 0) parts.push(`fill ${fills} open ${plural(fills, "shift", "shifts")}`)
  if (parts.length === 0) return "Review the recommended schedule changes."
  const sentence = parts.join(" and ")
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`
}

/** "Needs HHA", or just "Companion" for companionship shifts. Matches the design's open shift copy. */
export function describeRequirement(requirement: CaregiverRole) {
  return requirement === "Companion" ? "Companion" : `Needs ${requirement}`
}

export { plural }
