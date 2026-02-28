import Link from "next/link"
import { CalendarDays, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"

interface ProjectCardProps {
  project: {
    id: string
    title: string
    category: string | null
    status: string
    start_date: string | null
    responsible_person: string | null
  }
  condominiumSlug: string
}

export function ProjectCard({ project, condominiumSlug }: ProjectCardProps) {
  return (
    <Link href={`/app/${condominiumSlug}/projects/${project.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
              {project.title}
            </CardTitle>
            <StatusBadge status={project.status} />
          </div>
          {project.category && (
            <p className="text-xs text-muted-foreground">{project.category}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-1">
          {project.start_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span>
                Started{" "}
                {new Date(project.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          {project.responsible_person && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.responsible_person}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
