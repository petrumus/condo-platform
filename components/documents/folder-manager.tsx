"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FolderCard } from "./folder-card"
import { NewFolderDialog } from "./new-folder-dialog"
import { deleteFolder } from "@/app/app/[condominiumSlug]/documents/actions"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface Folder {
  id: string
  name: string
  default_visibility: Visibility
  document_count?: number
}

interface FolderManagerProps {
  folders: Folder[]
  condominiumSlug: string
  parentFolderId?: string | null
  isAdmin: boolean
}

export function FolderManager({
  folders,
  condominiumSlug,
  parentFolderId = null,
  isAdmin,
}: FolderManagerProps) {
  const router = useRouter()
  const [editFolder, setEditFolder] = useState<Folder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteError(null)
    startTransition(async () => {
      try {
        await deleteFolder(condominiumSlug, deleteTarget.id)
        setDeleteTarget(null)
        router.refresh()
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Failed to delete folder.")
      }
    })
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            condominiumSlug={condominiumSlug}
            isAdmin={isAdmin}
            onEdit={isAdmin ? (f) => setEditFolder(f) : undefined}
            onDelete={isAdmin ? (f) => setDeleteTarget(f) : undefined}
          />
        ))}
      </div>

      {/* Edit folder dialog */}
      {editFolder && (
        <NewFolderDialog
          condominiumSlug={condominiumSlug}
          parentFolderId={parentFolderId}
          editFolder={editFolder}
          open={Boolean(editFolder)}
          onOpenChange={(val) => { if (!val) setEditFolder(null) }}
          onClose={() => setEditFolder(null)}
        />
      )}

      {/* Delete folder dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(val) => { if (!val) { setDeleteTarget(null); setDeleteError(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span>?
              The folder must be empty before deletion.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(null) }} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
