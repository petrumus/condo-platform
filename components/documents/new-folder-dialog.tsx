"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FolderPlus, Loader2 } from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { createFolder, updateFolder } from "@/app/app/[condominiumSlug]/documents/actions"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface NewFolderDialogProps {
  condominiumSlug: string
  parentFolderId?: string | null
  /** When editing an existing folder */
  editFolder?: { id: string; name: string; default_visibility: Visibility }
  onClose?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: "public", label: "Public", description: "Visible to anyone, including non-members" },
  { value: "members", label: "Members", description: "Visible to all condominium members" },
  { value: "admin-only", label: "Admin Only", description: "Visible only to administrators" },
]

export function NewFolderDialog({
  condominiumSlug,
  parentFolderId = null,
  editFolder,
  onClose,
  open,
  onOpenChange,
}: NewFolderDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState(editFolder?.name ?? "")
  const [visibility, setVisibility] = useState<Visibility>(editFolder?.default_visibility ?? "members")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  function handleOpenChange(val: boolean) {
    if (!val) {
      setError(null)
      if (!editFolder) {
        setName("")
        setVisibility("members")
      }
      onClose?.()
    }
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError("Folder name is required.")
    setError(null)

    startTransition(async () => {
      try {
        if (editFolder) {
          await updateFolder(condominiumSlug, editFolder.id, name, visibility)
        } else {
          await createFolder(condominiumSlug, name, visibility, parentFolderId)
        }
        handleOpenChange(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save folder.")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <FolderPlus className="h-4 w-4 mr-1.5" />
            New Folder
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editFolder ? "Edit Folder" : "Create New Folder"}</DialogTitle>
          <DialogDescription>
            Set the folder name and default visibility for documents inside.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Folder Name *</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meeting Minutes 2026"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Default Visibility *</Label>
            <div className="flex flex-col gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={visibility === opt.value}
                    onChange={() => setVisibility(opt.value)}
                    className="mt-0.5 accent-foreground"
                  />
                  <div>
                    <span className="text-sm font-medium">{opt.label}</span>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              {editFolder ? "Save Changes" : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
