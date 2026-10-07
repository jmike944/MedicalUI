"use client"

import {
  Analytics01Icon,
  CheckListIcon,
  DashboardSquare01Icon,
  House03Icon,
  Invoice01Icon,
  SecurityCheckIcon,
  Settings02Icon,
  SparklesIcon,
  StethoscopeIcon,
  UserGroup02Icon,
  UserShield01Icon,
} from "@hugeicons/core-free-icons"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { AddPatientCard } from "./sidebar/add-patient-card"
import { NavGroup } from "./sidebar/nav-group"
import { SidebarNavProvider } from "./sidebar/nav-context"
import { NavItem } from "./sidebar/nav-item"
import { OnShiftGroup } from "./sidebar/on-shift-group"
import { ScheduleNavItem } from "./sidebar/schedule-nav-item"
import { SidebarLogo } from "./sidebar/sidebar-logo"
import { useScrollFade } from "./sidebar/use-scroll-fade"

/**
 * CareOps navigation. Rows cascade in top to bottom after the logo, the active
 * row's pill glides between entries, and each section collapses from its label.
 * "Add a patient" rests at the bottom when everything fits and scrolls with the
 * rows on short screens, where the edges fade to show there is more.
 */
export function AppSidebar() {
  const contentRef = useScrollFade<HTMLDivElement>()

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 group-data-[side=left]:border-r-0">
      <SidebarNavProvider defaultActiveId="schedule">
        <SidebarHeader className="gap-0 px-[35px] pt-[29px] pb-0">
          <SidebarLogo />
        </SidebarHeader>

        <SidebarContent
          ref={contentRef}
          className="gap-0 pt-[32px] pr-[25px] pb-6 pl-[23px] data-scroll-fade:[mask-image:linear-gradient(to_bottom,transparent,#000_var(--fade-top),#000_calc(100%_-_var(--fade-bottom)),transparent)]"
        >
          {/* Everything above "Add a patient": the destinations, plus who is on shift. A flex
              column like SidebarContent, so the sections keep their spacing. */}
          <nav aria-label="Primary" className="flex shrink-0 flex-col">
            <NavGroup label="Menu" step={0}>
              <SidebarMenu className="gap-1">
                <NavItem id="overview" label="Overview" icon={DashboardSquare01Icon} step={1} />
                <NavItem
                  id="patients"
                  label="Patients"
                  icon={UserGroup02Icon}
                  step={2}
                  badge={10}
                  badgeLabel="new referrals"
                />
                <NavItem id="caregivers" label="Caregivers" icon={StethoscopeIcon} step={3} />
                <ScheduleNavItem step={4} />
                <NavItem id="visits" label="Visits" icon={House03Icon} step={5} />
                <NavItem id="care-plans" label="Care Plans" icon={CheckListIcon} step={6} />
                <NavItem id="ai-copilot" label="AI Copilot" icon={SparklesIcon} step={7} />
              </SidebarMenu>
            </NavGroup>

            <NavGroup label="Business" step={8} className="mt-[23px]">
              <SidebarMenu className="gap-1">
                <NavItem
                  id="billing"
                  label="Billing & Claims"
                  icon={Invoice01Icon}
                  step={9}
                  badge={14}
                  badgeLabel="claims to review"
                />
                <NavItem id="compliance" label="Compliance" icon={SecurityCheckIcon} step={10} />
                <NavItem id="reports" label="Reports" icon={Analytics01Icon} step={11} />
              </SidebarMenu>
            </NavGroup>

            <OnShiftGroup step={12} className="mt-[23px]" />

            <SidebarGroup className="mt-[26px] p-0">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  <NavItem
                    id="settings"
                    label="Settings"
                    icon={Settings02Icon}
                    step={15}
                    size="compact"
                  />
                  <NavItem
                    id="team"
                    label="Team & Permissions"
                    icon={UserShield01Icon}
                    step={16}
                    size="compact"
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </nav>

          <div className="mt-auto shrink-0 pt-3">
            <AddPatientCard step={17} />
          </div>
        </SidebarContent>
      </SidebarNavProvider>
    </Sidebar>
  )
}
