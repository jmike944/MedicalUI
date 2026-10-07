// Mock data for Juniper Home Health's schedule on Wednesday, Sep 30.
// Times are decimal hours on a 24h clock: 10.75 is 10:45 AM, 13.5 is 1:30 PM.

export type VisitStatus = "done" | "in-progress" | "scheduled" | "attention"

export type CaregiverRole = "RN" | "LPN" | "HHA" | "CNA" | "Companion"

export type Caregiver = {
  id: string
  name: string
  role: CaregiverRole
  /** Roles this caregiver is qualified to cover, used to match open shifts. */
  qualifications: CaregiverRole[]
  avatar: string
  weeklyHours: number
  weeklyLimit: number
  onShift: boolean
}

export type Visit = {
  id: string
  caregiverId: string
  patient: string
  start: number
  end: number
  status: VisitStatus
  service: string
  address: string
  /** Why a visit needs attention, shown in its hover card. */
  alert?: string
}

export type OpenShift = {
  id: string
  patient: string
  /** Compact label for narrow timeline blocks. */
  shortLabel: string
  start: number
  end: number
  requirement: CaregiverRole
  service: string
  address: string
}

export type Suggestion =
  | {
      id: string
      kind: "fill-open-shift"
      title: string
      description: string
      openShiftId: string
      toCaregiverId: string
    }
  | {
      id: string
      kind: "reassign"
      title: string
      description: string
      visitId: string
      fromCaregiverId: string
      toCaregiverId: string
      /** Overtime hours saved, including travel time. */
      savesHours: number
    }

export const AGENCY = {
  name: "Juniper Home Health",
  initials: "JH",
  dateLabel: "Wednesday, Sep 30",
  /** Agency-wide visit count; the board shows a subset of caregivers. */
  totalVisits: 142,
  caregiversOnShift: 23,
  caregiversTotal: 62,
} as const

export const CURRENT_USER = {
  name: "Jordan Hale",
  role: "Scheduling lead",
  avatar: "/avatars/jordan-hale.svg",
} as const

/** First and last hour columns on the day timeline (7 AM to 7 PM). */
export const DAY_START = 7
export const DAY_END = 19
/** "Now" on the board. Fixed so the mock day always renders the same way. */
export const NOW = 10.75

/** Share of the weekly limit at which a caregiver is flagged for overtime. */
export const OVERTIME_THRESHOLD = 0.9

export const caregivers: Caregiver[] = [
  { id: "maria-lopez", name: "Maria Lopez", role: "RN", qualifications: ["RN", "LPN", "HHA", "Companion"], avatar: "/avatars/maria-lopez.svg", weeklyHours: 29, weeklyLimit: 40, onShift: true },
  { id: "james-carter", name: "James Carter", role: "HHA", qualifications: ["HHA", "Companion"], avatar: "/avatars/james-carter.svg", weeklyHours: 36, weeklyLimit: 40, onShift: true },
  { id: "aisha-bello", name: "Aisha Bello", role: "LPN", qualifications: ["LPN", "HHA", "Companion"], avatar: "/avatars/aisha-bello.svg", weeklyHours: 31, weeklyLimit: 40, onShift: true },
  { id: "devon-price", name: "Devon Price", role: "CNA", qualifications: ["CNA", "HHA", "Companion"], avatar: "/avatars/devon-price.svg", weeklyHours: 24, weeklyLimit: 40, onShift: true },
  { id: "carlos-mendes", name: "Carlos Mendes", role: "HHA", qualifications: ["HHA", "Companion"], avatar: "/avatars/carlos-mendes.svg", weeklyHours: 27, weeklyLimit: 40, onShift: true },
  { id: "priya-raman", name: "Priya Raman", role: "RN", qualifications: ["RN", "LPN", "HHA", "Companion"], avatar: "/avatars/priya-raman.svg", weeklyHours: 22, weeklyLimit: 36, onShift: true },
  { id: "rosa-delgado", name: "Rosa Delgado", role: "HHA", qualifications: ["HHA", "Companion"], avatar: "/avatars/rosa-delgado.svg", weeklyHours: 38, weeklyLimit: 40, onShift: true },
  { id: "tanya-brooks", name: "Tanya Brooks", role: "HHA", qualifications: ["HHA", "Companion"], avatar: "/avatars/tanya-brooks.svg", weeklyHours: 18, weeklyLimit: 32, onShift: false },
  { id: "elena-ruiz", name: "Elena Ruiz", role: "Companion", qualifications: ["Companion"], avatar: "/avatars/elena-ruiz.svg", weeklyHours: 20, weeklyLimit: 32, onShift: true },
]

export const visits: Visit[] = [
  { id: "v-sarah-mitchell", caregiverId: "maria-lopez", patient: "Sarah Mitchell", start: 8, end: 10, status: "done", service: "Wound care", address: "14 Alder Ct" },
  { id: "v-dorothy-nguyen", caregiverId: "maria-lopez", patient: "Dorothy Nguyen", start: 11, end: 13, status: "scheduled", service: "Skilled nursing", address: "902 Birch Ave" },
  { id: "v-harold-k", caregiverId: "maria-lopez", patient: "Harold K.", start: 14, end: 15, status: "scheduled", service: "Medication review", address: "3 Larkspur Ln" },

  { id: "v-walter-s-am", caregiverId: "james-carter", patient: "Walter S.", start: 8.5, end: 9.5, status: "done", service: "Personal care", address: "77 Quarry Rd" },
  { id: "v-helen-park", caregiverId: "james-carter", patient: "Helen Park", start: 10.5, end: 12, status: "in-progress", service: "Personal care", address: "410 Juniper St" },
  { id: "v-frank-r", caregiverId: "james-carter", patient: "Frank R.", start: 15, end: 16, status: "scheduled", service: "Mobility assist", address: "58 Elm Row" },

  { id: "v-m-oneil", caregiverId: "aisha-bello", patient: "M. O'Neil", start: 7.5, end: 8.5, status: "done", service: "Vitals check", address: "12 Harbor Way" },
  { id: "v-joseph-ramirez", caregiverId: "aisha-bello", patient: "Joseph Ramirez", start: 9.5, end: 11.5, status: "in-progress", service: "Post-op care", address: "221 Pinecrest Dr" },
  { id: "v-ruth-c", caregiverId: "aisha-bello", patient: "Ruth C.", start: 13, end: 14, status: "scheduled", service: "Medication review", address: "9 Willow Bend" },
  { id: "v-nora-c", caregiverId: "aisha-bello", patient: "Nora C.", start: 16, end: 17, status: "scheduled", service: "Vitals check", address: "640 Cedar Blvd" },

  { id: "v-thomas-reed", caregiverId: "devon-price", patient: "Thomas Reed", start: 9, end: 11, status: "in-progress", service: "Physical therapy", address: "35 Summit Ave" },
  { id: "v-betty-anderson", caregiverId: "devon-price", patient: "Betty Anderson", start: 12, end: 14, status: "scheduled", service: "Personal care", address: "118 Orchard Ln" },

  { id: "v-linda-alvarez", caregiverId: "carlos-mendes", patient: "Linda Alvarez", start: 8, end: 10, status: "done", service: "Personal care", address: "5 Meadow Ct" },
  { id: "v-charles-wu", caregiverId: "carlos-mendes", patient: "Charles Wu", start: 11, end: 13, status: "scheduled", service: "Respite care", address: "780 Lakeview Dr" },
  { id: "v-irene-foster", caregiverId: "carlos-mendes", patient: "Irene Foster", start: 13, end: 15, status: "attention", service: "Personal care", address: "26 Foxglove St", alert: "Authorization expires today. Renew before the visit starts." },

  { id: "v-evelyn-s", caregiverId: "priya-raman", patient: "Evelyn S.", start: 10, end: 11, status: "in-progress", service: "Skilled nursing", address: "301 Ridge Rd" },
  { id: "v-walter-s-pm", caregiverId: "priya-raman", patient: "Walter S.", start: 13.5, end: 14.5, status: "scheduled", service: "Medication review", address: "77 Quarry Rd" },

  { id: "v-george-whitaker-am", caregiverId: "rosa-delgado", patient: "George Whitaker", start: 7, end: 10, status: "done", service: "Personal care", address: "48 Chestnut Pl" },
  { id: "v-joan-pierce", caregiverId: "rosa-delgado", patient: "Joan Pierce", start: 11, end: 14, status: "scheduled", service: "Respite care", address: "15 Bayberry Ln" },

  { id: "v-clara-jensen", caregiverId: "tanya-brooks", patient: "Clara Jensen", start: 13, end: 15, status: "scheduled", service: "Personal care", address: "660 Magnolia Ave" },

  { id: "v-paul-j", caregiverId: "elena-ruiz", patient: "Paul J.", start: 8, end: 9, status: "done", service: "Companionship", address: "92 Spruce St" },
  { id: "v-linda-a", caregiverId: "elena-ruiz", patient: "Linda A.", start: 12, end: 13, status: "scheduled", service: "Companionship", address: "5 Meadow Ct" },
  { id: "v-arthur-b", caregiverId: "elena-ruiz", patient: "Arthur B.", start: 16, end: 17, status: "scheduled", service: "Companionship", address: "407 Hawthorne Rd" },
]

export const openShifts: OpenShift[] = [
  { id: "os-george-whitaker", patient: "George Whitaker", shortLabel: "George Whitaker", start: 16, end: 18, requirement: "HHA", service: "Evening personal care", address: "48 Chestnut Pl" },
  { id: "os-nancy-flores", patient: "Nancy Flores", shortLabel: "Nancy F.", start: 18, end: 19, requirement: "Companion", service: "Companionship", address: "233 Poplar St" },
]

export const suggestions: Suggestion[] = [
  {
    id: "s-reassign-frank",
    kind: "reassign",
    title: "Move Frank R. to Tanya Brooks",
    description: "James Carter is at 36 of 40 h. Tanya is free from 3 PM and lives 6 min away.",
    visitId: "v-frank-r",
    fromCaregiverId: "james-carter",
    toCaregiverId: "tanya-brooks",
    savesHours: 1.5,
  },
  {
    id: "s-fill-nancy",
    kind: "fill-open-shift",
    title: "Give Nancy Flores' shift to Elena Ruiz",
    description: "Elena is a Companion, free after 5 PM, and has visited Nancy before.",
    openShiftId: "os-nancy-flores",
    toCaregiverId: "elena-ruiz",
  },
]
