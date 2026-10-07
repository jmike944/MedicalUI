import { AiCopilotCard } from "@/components/dashboard/ai-copilot-card"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { OpenShiftsCard } from "@/components/dashboard/open-shifts-card"
import { OvertimeWatchCard } from "@/components/dashboard/overtime-watch-card"
import { ScheduleBoard } from "@/components/dashboard/schedule-board"
import { ScheduleProvider } from "@/components/dashboard/schedule-store"
import { SuggestionsSheet } from "@/components/dashboard/suggestions-sheet"
import { TopBar } from "@/components/dashboard/top-bar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function SchedulePage() {
  return (
    <ScheduleProvider>
      <SidebarProvider style={{ "--sidebar-width": "17rem" } as React.CSSProperties}>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <TopBar />
          <div className="mx-3 mb-3 flex flex-1 flex-col gap-5 rounded-[2rem] bg-panel p-3 sm:p-4 md:mr-6 md:mb-[22px] md:ml-0 md:rounded-[2.5rem] md:p-6">
            <ScheduleBoard />
            <section
              aria-label="Today at a glance"
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-[359fr_349fr_349fr]"
            >
              <AiCopilotCard />
              <OpenShiftsCard />
              <OvertimeWatchCard />
            </section>
          </div>
        </SidebarInset>
        <SuggestionsSheet />
      </SidebarProvider>
    </ScheduleProvider>
  )
}
