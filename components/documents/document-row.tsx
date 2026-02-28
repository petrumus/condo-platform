"use client"

import { useState, useTransition } from "react"
import { FileText, Download, Loader2 } from "lucide-react"
import { VisibilityBadge } from "./visibility-badge"
import { generateDownloadUrl } from "@/app/app/[condominiumSlug]/documents/actions"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface DocumentRowProps {
  document: {
    id: string
    name: string
    file_size_bytes: number | null
    mime_type: string | null
    created_at: string
    visibility_override: Visibility | null
  }
  effectiveVisibility: Visibility
  condominiumSlug: string
  isAdmin: boolean
  onEdit?: (doc: { id: string; name: string; visibility_override: Visibility | null }) => void
  onDelete?: (doc: { id: string; name: string }) => void
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentRow({
  document,
  effectiveVisibility,
  condominiumSlug,
  isAdmin,
  onEdit,
  onDelete,
}: DocumentRowProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDownload() {
    setError(null)
    startTransition(async () => {
      try {
        const url = await generateDownloadUrl(condominiumSlug, document.id)
        window.open(url, "_blank", "noopener,noreferrer")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get download link.")
      }
    })
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4 border rounded-lg hover:bg-muted/40 transition-colors group">
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-1">{document.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <VisibilityBadge visibility={effectiveVisibility} />
          <span className="text-xs text-muted-foreground">{formatBytes(document.file_size_bytes)}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(document.created_at).toLocaleDateString()}
          </span>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isAdmin && (
          <>
            {onEdit && (
              <button
                onClick={() => onEdit(document)}
                className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(document)}
                className="text-xs text-muted-foreground hover:text-destructive px-1.5 py-0.5 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            )}
          </>
        )}
        <button
          onClick={handleDownload}
          disabled={isPending}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-muted transition-colors disabled:opacity-50"
          title="Download"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
