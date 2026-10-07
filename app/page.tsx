import { AiCopilotCard } from "@/components/dashboard/ai-copilot-card"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { ContentScroller } from "@/components/dashboard/content-scroller"
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
      <SidebarProvider
        style={{ "--sidebar-width": "17rem", "--sidebar-width-icon": "4.5rem" } as React.CSSProperties}
      >
        <AppSidebar />
        {/* App shell: the inset is exactly one screen tall and never scrolls. The top bar and the
            lavender panel stay put; only the cards inside the panel scroll. */}
        <SidebarInset className="h-svh min-w-0 overflow-hidden">
          <TopBar />
          {/*
            The lavender panel is a fixed, rounded frame filling the rest of the screen. It fades in
            from the very first paint (CSS, so it doesn't wait for hydration); the cards inside then
            run their own motion entrances.
          */}
          <main
            id={MAIN_ID}
            tabIndex={-1}
            className="mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-panel outline-none animate-in fade-in-0 zoom-in-[0.985] duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] md:mr-6 md:mb-[22px] md:ml-0"
          >
            {/* The scroll area carries the panel's padding, so cards scroll right up to its rounded
                edge. Its children keep their natural height (*:shrink-0); cards clip their own
                overflow, so flex would otherwise squash them to fit instead of scrolling. It is
                also the container the glance grid sizes against, since the docked sidebar eats
                into the viewport. */}
            <ContentScroller className="@container flex flex-col gap-5 p-3 *:shrink-0 sm:p-4 md:p-6">
              <ScheduleBoard />
              <section
                aria-label="Today at a glance"
                className="grid gap-5 @2xl:grid-cols-2 @2xl:*:last:col-span-2 @min-[60rem]:grid-cols-[359fr_349fr_349fr] @min-[60rem]:*:last:col-span-1"
              >
                <AiCopilotCard />
                <OpenShiftsCard />
                <OvertimeWatchCard />
              </section>
            </ContentScroller>
          </main>
        </SidebarInset>
        <SuggestionsSheet />
      </SidebarProvider>
    </ScheduleProvider>
  )
}
