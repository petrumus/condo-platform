import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-primary text-primary-foreground",
        className,
      )}
    >
      <Building2 className="h-1/2 w-1/2" />
    </div>
  )
}
