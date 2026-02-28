import { Badge } from "@/components/ui/badge"
import type { InitiativeStatus } from "@/app/app/[condominiumSlug]/initiatives/actions"

const STATUS_CONFIG: Record<
  InitiativeStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_review: { label: "Pending Review", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  converted: { label: "Converted", variant: "secondary" },
}

interface InitiativeStatusBadgeProps {
  status: string
}

export function InitiativeStatusBadge({ status }: InitiativeStatusBadgeProps) {
  const config = STATUS_CONFIG[status as InitiativeStatus] ?? {
    label: status,
    variant: "secondary" as const,
  }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
