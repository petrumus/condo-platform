import { Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GovernanceMember } from "@/lib/queries/administration"

interface GovernanceMemberCardProps {
  member: GovernanceMember
}

export function GovernanceMemberCard({ member }: GovernanceMemberCardProps) {
  const displayName = member.fullName ?? member.email ?? "Unknown Member"
  const initials = getInitials(displayName)

  return (
    <Card className="text-center">
      <CardContent className="pt-6 pb-5 flex flex-col items-center gap-3">
        {/* Avatar */}
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt={displayName}
            className="h-16 w-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold shrink-0">
            {initials}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1">
          <p className="font-semibold text-sm leading-tight">{displayName}</p>
          <Badge variant="secondary" className="text-xs">
            {member.titleName}
          </Badge>
        </div>

        {/* Contact */}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[160px]">{member.email}</span>
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
