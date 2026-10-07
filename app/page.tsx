import { AiCopilotCard } from "@/components/dashboard/ai-copilot-card"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { OpenShiftsCard } from "@/components/dashboard/open-shifts-card"
import { OvertimeWatchCard } from "@/components/dashboard/overtime-watch-card"
import { ScheduleBoard } from "@/components/dashboard/schedule-board"
import { ScheduleProvider } from "@/components/dashboard/schedule-store"
import { SuggestionsSheet } from "@/components/dashboard/suggestions-sheet"
import { TopBar } from "@/components/dashboard/top-bar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const MAIN_ID = "schedule-panel"

export default function SchedulePage() {
  return (
    <ScheduleProvider>
      {/* First tab stop: jumps past the sidebar's links straight to the schedule. */}
      <a
        href={`#${MAIN_ID}`}
        className="fixed top-3 left-3 z-50 -translate-y-16 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg outline-none transition-transform duration-200 ease-out focus-visible:translate-y-0 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
      >
        Skip to schedule
      </a>
      <SidebarProvider style={{ "--sidebar-width": "17rem" } as React.CSSProperties}>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <TopBar />
          {/*
            The lavender panel fades in from the very first paint (CSS, so it doesn't wait for
            hydration); the cards inside then run their own motion entrances. It is also the
            container the glance grid sizes against, since the docked sidebar eats into the viewport.
          */}
          <main
            id={MAIN_ID}
            tabIndex={-1}
            className="@container mx-3 mb-3 flex flex-1 flex-col gap-5 rounded-[2rem] bg-panel p-3 outline-none animate-in fade-in-0 zoom-in-[0.985] duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] sm:p-4 md:mr-6 md:mb-[22px] md:ml-0 md:p-6"
          >
            <ScheduleBoard />
            <section
              aria-label="Today at a glance"
              className="grid gap-5 @2xl:grid-cols-2 @2xl:*:last:col-span-2 @min-[60rem]:grid-cols-[359fr_349fr_349fr] @min-[60rem]:*:last:col-span-1"
            >
              <AiCopilotCard />
              <OpenShiftsCard />
              <OvertimeWatchCard />
            </section>
          </main>
        </SidebarInset>
        <SuggestionsSheet />
      </SidebarProvider>
    </ScheduleProvider>
  )
}
