import { AGENCY } from "@/lib/schedule-data"

/** Agency mark, name, and the page context ("Schedule · Wednesday, Sep 30"). */
export function OrgIdentity() {
  return (
    <div className="group/org flex min-w-0 items-center gap-3">
      <div
        aria-hidden
        className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-panel sm:flex text-[15px] font-medium text-foreground transition-transform duration-300 ease-out select-none group-hover/org:scale-105 sm:size-12 sm:text-[17px]"
      >
        {AGENCY.initials}
      </div>
      <div className="flex min-w-0 flex-col sm:mt-0.5">
        {/* The agency is context, not the page subject: "Schedule" is the page's h1. */}
        <p className="truncate text-[15px] leading-[22px] font-medium text-foreground sm:text-[16.5px]">
          {AGENCY.name}
        </p>
        <p className="hidden truncate text-[15px] leading-[22px] text-muted-foreground sm:block">
          Schedule · {AGENCY.dateLabel}
        </p>
      </div>
    </div>
  )
}
