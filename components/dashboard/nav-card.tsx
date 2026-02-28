import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface NavCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

export function NavCard({ href, icon: Icon, title, description }: NavCardProps) {
  return (
    <Link href={href}>
      <Card className="group h-full transition-colors hover:border-primary/50 hover:bg-accent/30 cursor-pointer">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
