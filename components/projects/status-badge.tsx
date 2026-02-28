import { Badge } from "@/components/ui/badge"
import type { ProjectStatus } from "@/app/app/[condominiumSlug]/projects/actions"

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  proposed: { label: "Proposed", variant: "secondary" },
  approved: { label: "Approved", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  archived: { label: "Archived", variant: "secondary" },
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as ProjectStatus] ?? {
    label: status,
    variant: "secondary" as const,
  }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
