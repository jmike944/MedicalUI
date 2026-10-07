import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/** Avatar for a person in the dashboard; falls back to initials if the image fails. */
export function PersonAvatar({
  name,
  src,
  className,
  size,
}: {
  name: string
  src?: string
  className?: string
  size?: React.ComponentProps<typeof Avatar>["size"]
}) {
  return (
    <Avatar size={size} className={className}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
