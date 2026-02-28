import { Badge } from "@/components/ui/badge"
import type { BallotStatus } from "@/app/app/[condominiumSlug]/ballots/actions"

const STATUS_CONFIG: Record<
  BallotStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  open: { label: "Open", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
  results_published: { label: "Results Published", variant: "outline" },
}

interface BallotStatusBadgeProps {
  status: string
}

export function BallotStatusBadge({ status }: BallotStatusBadgeProps) {
  const config = STATUS_CONFIG[status as BallotStatus] ?? {
    label: status,
    variant: "secondary" as const,
  }
  return (
    <Badge variant={config.variant} className="shrink-0 capitalize text-xs">
      {config.label}
    </Badge>
  )
}
