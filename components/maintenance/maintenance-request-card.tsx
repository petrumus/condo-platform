import Link from "next/link"
import { CalendarDays, MapPin, Tag } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MaintenanceStatusBadge } from "./maintenance-status-badge"
import { MaintenancePriorityBadge } from "./maintenance-priority-badge"
import type { Tables } from "@/lib/types/database"

interface MaintenanceRequestCardProps {
  request: Pick<
    Tables<"maintenance_requests">,
    "id" | "title" | "category" | "location" | "priority" | "status" | "created_at"
  >
  condominiumSlug: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function MaintenanceRequestCard({ request, condominiumSlug }: MaintenanceRequestCardProps) {
  return (
    <Link href={`/app/${condominiumSlug}/maintenance/${request.id}`} className="block group">
      <Card className="h-full hover:border-foreground/30 transition-colors">
        <CardHeader className="pb-2 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug group-hover:underline line-clamp-2">
              {request.title}
            </h3>
            <MaintenanceStatusBadge status={request.status} className="shrink-0" />
          </div>
          <MaintenancePriorityBadge priority={request.priority} />
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5">
          {request.category && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span>{request.category}</span>
            </div>
          )}
          {request.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{request.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(request.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
