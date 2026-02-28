import { Globe, Users, Lock } from "lucide-react"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface VisibilityBadgeProps {
  visibility: Visibility
}

const config: Record<Visibility, { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  public: {
    label: "Public",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Icon: Globe,
  },
  members: {
    label: "Members",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Icon: Users,
  },
  "admin-only": {
    label: "Admin Only",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Icon: Lock,
  },
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const { label, className, Icon } = config[visibility]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
