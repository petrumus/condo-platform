import Link from "next/link"
import { Pin, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface AnnouncementCardProps {
  announcement: {
    id: string
    title: string
    body: string
    pinned: boolean
    published_at: string | null
  }
  condominiumSlug: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function bodyPreview(body: string, maxLength = 120): string {
  const trimmed = body.replace(/\n+/g, " ").trim()
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) + "…" : trimmed
}

export function AnnouncementCard({ announcement, condominiumSlug }: AnnouncementCardProps) {
  return (
    <Link
      href={`/app/${condominiumSlug}/announcements/${announcement.id}`}
      className="block group"
    >
      <Card className="h-full transition-colors group-hover:border-foreground/30">
        <CardHeader className="pb-2 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug group-hover:underline underline-offset-4">
              {announcement.title}
            </h3>
            {announcement.pinned && (
              <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs text-muted-foreground">
          {announcement.body && (
            <p className="leading-relaxed">{bodyPreview(announcement.body)}</p>
          )}
          {announcement.published_at && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3 shrink-0" />
              {formatDate(announcement.published_at)}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
