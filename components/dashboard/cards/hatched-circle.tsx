import { cn } from "@/lib/utils"

/** Diagonally hatched placeholder avatar for a shift nobody covers yet. Its stripes march slowly. */
export function HatchedCircle({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block size-10 shrink-0 animate-hatch-march rounded-full bg-hatched ring-1 ring-hatch/80 ring-inset",
        className
      )}
    />
  )
}
