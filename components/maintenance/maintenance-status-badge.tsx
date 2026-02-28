import { cn } from "@/lib/utils"
import type { MaintenanceStatus } from "@/app/app/[condominiumSlug]/maintenance/actions"

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  open: "Open",
  in_review: "In Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
}

const STATUS_CLASSES: Record<MaintenanceStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_review: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
}

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus
  className?: string
}

export function MaintenanceStatusBadge({ status, className }: MaintenanceStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
