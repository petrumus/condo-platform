import Link from "next/link"
import { Tag, CalendarDays, User } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { InitiativeStatusBadge } from "./initiative-status-badge"

interface InitiativeCardProps {
  initiative: {
    id: string
    title: string
    category: string | null
    status: string
    created_at: string
    submitter_name?: string | null
  }
  condominiumSlug: string
}

export function InitiativeCard({ initiative, condominiumSlug }: InitiativeCardProps) {
  const date = new Date(initiative.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link href={`/app/${condominiumSlug}/initiatives/${initiative.id}`} className="block group">
      <Card className="h-full transition-colors group-hover:border-foreground/30">
        <CardHeader className="pb-2 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug group-hover:underline underline-offset-4">
              {initiative.title}
            </h3>
            <InitiativeStatusBadge status={initiative.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs text-muted-foreground">
          {initiative.category && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-3 w-3 shrink-0" />
              {initiative.category}
            </div>
          )}
          {initiative.submitter_name && (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 shrink-0" />
              {initiative.submitter_name}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {date}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
