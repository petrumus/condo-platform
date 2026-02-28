import { cn } from "@/lib/utils"
import type { MaintenancePriority } from "@/app/app/[condominiumSlug]/maintenance/actions"

const PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const PRIORITY_CLASSES: Record<MaintenancePriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
}

interface MaintenancePriorityBadgeProps {
  priority: MaintenancePriority
  className?: string
}

export function MaintenancePriorityBadge({ priority, className }: MaintenancePriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        PRIORITY_CLASSES[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
