import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const hatchedCircleVariants = cva(
  "block shrink-0 rounded-full bg-hatched ring-1 ring-hatch/80 ring-inset",
  {
    variants: {
      size: {
        /** Avatar-sized, for list rows and cards. */
        default: "size-10",
        /** Lane-label size on the schedule. */
        sm: "size-[30px]",
      },
      march: {
        /** Stripes march continuously. */
        always: "animate-hatch-march",
        /**
         * Stripes march only while the circle, an enclosing shadcn `Item` (`group/item`) or an
         * ancestor marked `group/hatch` is hovered or holds focus.
         */
        hover:
          "hover:animate-hatch-march group-hover/item:animate-hatch-march group-focus-within/item:animate-hatch-march group-hover/hatch:animate-hatch-march group-focus-within/hatch:animate-hatch-march",
        /** Static stripes. */
        none: "",
      },
    },
    defaultVariants: { size: "default", march: "always" },
  }
)

/** Diagonally hatched placeholder avatar for a shift nobody covers yet. */
export function HatchedCircle({
  size,
  march,
  className,
}: VariantProps<typeof hatchedCircleVariants> & { className?: string }) {
  return <span aria-hidden className={cn(hatchedCircleVariants({ size, march }), className)} />
}
