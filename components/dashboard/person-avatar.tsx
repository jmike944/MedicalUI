import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/** Rendered pixel size of each Avatar size variant, used as the image's intrinsic size hint. */
const SIZE_PX = { sm: 24, default: 32, lg: 40 } as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Avatar for a person in the dashboard; falls back to initials if the image fails.
 *
 * Decorative by default (`alt=""`): avatars almost always sit beside the person's visible name or
 * inside a control that is already labelled, so naming them again would read the name twice.
 * Pass `alt` when the avatar stands on its own.
 */
export function PersonAvatar({
  name,
  src,
  alt = "",
  className,
  size = "default",
}: {
  name: string
  src?: string
  alt?: string
  className?: string
  size?: keyof typeof SIZE_PX
}) {
  const px = SIZE_PX[size]
  return (
    <Avatar size={size} className={className}>
      {src ? <AvatarImage src={src} alt={alt} width={px} height={px} /> : null}
      {alt ? (
        <AvatarFallback role="img" aria-label={alt}>
          {initials(name)}
        </AvatarFallback>
      ) : (
        <AvatarFallback aria-hidden>{initials(name)}</AvatarFallback>
      )}
    </Avatar>
  )
}
