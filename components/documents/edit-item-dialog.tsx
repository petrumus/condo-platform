"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateDocument, deleteDocument } from "@/app/app/[condominiumSlug]/documents/actions"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface EditDocumentDialogProps {
  condominiumSlug: string
  document: { id: string; name: string; visibility_override: Visibility | null } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const VISIBILITY_OPTIONS: { value: Visibility | ""; label: string }[] = [
  { value: "", label: "Inherit from folder" },
  { value: "public", label: "Public" },
  { value: "members", label: "Members" },
  { value: "admin-only", label: "Admin Only" },
]

export function EditDocumentDialog({
  condominiumSlug,
  document,
  open,
  onOpenChange,
}: EditDocumentDialogProps) {
  const router = useRouter()
  const [name, setName] = useState(document?.name ?? "")
  const [visibilityOverride, setVisibilityOverride] = useState<Visibility | "">(
    document?.visibility_override ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync state when document changes
  function handleOpenChange(val: boolean) {
    if (val && document) {
      setName(document.name)
      setVisibilityOverride(document.visibility_override ?? "")
      setError(null)
    }
    onOpenChange(val)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!document) return
    if (!name.trim()) return setError("Name is required.")
    setError(null)

    startTransition(async () => {
      try {
        await updateDocument(
          condominiumSlug,
          document.id,
          name,
          visibilityOverride || null
        )
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update document.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>Update the display name or visibility of this file.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="doc-name">Display Name *</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-visibility">Visibility Override</Label>
            <select
              id="doc-visibility"
              value={visibilityOverride}
              onChange={(e) => setVisibilityOverride(e.target.value as Visibility | "")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

interface DeleteDocumentDialogProps {
  condominiumSlug: string
  document: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDocumentDialog({
  condominiumSlug,
  document,
  open,
  onOpenChange,
}: DeleteDocumentDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!document) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteDocument(condominiumSlug, document.id)
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete document.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">{document?.name}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
