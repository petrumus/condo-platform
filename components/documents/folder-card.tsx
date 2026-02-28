import Link from "next/link"
import { Folder } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { VisibilityBadge } from "./visibility-badge"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface FolderCardProps {
  folder: {
    id: string
    name: string
    default_visibility: Visibility
    document_count?: number
  }
  condominiumSlug: string
  parentFolderId?: string
  isAdmin: boolean
  onEdit?: (folder: { id: string; name: string; default_visibility: Visibility }) => void
  onDelete?: (folder: { id: string; name: string }) => void
}

export function FolderCard({
  folder,
  condominiumSlug,
  isAdmin,
  onEdit,
  onDelete,
}: FolderCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <Folder className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/app/${condominiumSlug}/documents/${folder.id}`}
              className="font-medium hover:underline underline-offset-4 line-clamp-1 block"
            >
              {folder.name}
            </Link>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <VisibilityBadge visibility={folder.default_visibility} />
              {folder.document_count !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {folder.document_count} {folder.document_count === 1 ? "file" : "files"}
                </span>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(folder)}
                  className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(folder)}
                  className="text-xs text-muted-foreground hover:text-destructive px-1.5 py-0.5 rounded hover:bg-destructive/10 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
