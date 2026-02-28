import { MessageSquare } from "lucide-react"

interface ProjectUpdateItemProps {
  update: {
    id: string
    body: string
    created_at: string
  }
}

export function ProjectUpdateItem({ update }: ProjectUpdateItemProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-xs text-muted-foreground">
          {new Date(update.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="text-sm whitespace-pre-wrap">{update.body}</p>
      </div>
    </div>
  )
}
