"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2 } from "lucide-react"
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
import { uploadDocument } from "@/app/app/[condominiumSlug]/documents/actions"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface UploadFileDialogProps {
  condominiumSlug: string
  folderId: string | null
}

const VISIBILITY_OPTIONS: { value: Visibility | ""; label: string }[] = [
  { value: "", label: "Inherit from folder" },
  { value: "public", label: "Public" },
  { value: "members", label: "Members" },
  { value: "admin-only", label: "Admin Only" },
]

export function UploadFileDialog({ condominiumSlug, folderId }: UploadFileDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [visibilityOverride, setVisibilityOverride] = useState<Visibility | "">("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setOpen(false)
    setCustomName("")
    setVisibilityOverride("")
    setError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setError("Please select a file.")
    setError(null)

    const fd = new FormData()
    fd.append("file", file)
    if (customName.trim()) fd.append("name", customName.trim())
    if (visibilityOverride) fd.append("visibility_override", visibilityOverride)

    startTransition(async () => {
      try {
        await uploadDocument(condominiumSlug, folderId, fd)
        handleClose()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-1.5" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Supported: PDF, Word, Excel, PowerPoint, text, CSV, and common image formats. Max 50 MB.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="file-input">File *</Label>
            <Input
              id="file-input"
              type="file"
              ref={fileRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file-name">Display Name (optional)</Label>
            <Input
              id="file-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Leave blank to use the file name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visibility-override">Visibility Override</Label>
            <select
              id="visibility-override"
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
            <p className="text-xs text-muted-foreground">
              Overrides the folder's default visibility for this file only.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
