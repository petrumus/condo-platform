"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { publishAnnouncement, updateAnnouncement } from "@/app/app/[condominiumSlug]/announcements/actions"

interface AnnouncementFormProps {
  condominiumSlug: string
  /** When provided, the form is in edit mode */
  existing?: {
    id: string
    title: string
    body: string
    pinned: boolean
  }
}

export function AnnouncementForm({ condominiumSlug, existing }: AnnouncementFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(existing?.title ?? "")
  const [body, setBody] = useState(existing?.body ?? "")
  const [pinned, setPinned] = useState(existing?.pinned ?? false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!existing

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...selected])
    // Reset input so the same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    setError(null)

    const fd = new FormData()
    fd.set("title", title.trim())
    fd.set("body", body.trim())
    fd.set("pinned", String(pinned))
    files.forEach((f) => fd.append("files", f))

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateAnnouncement(condominiumSlug, existing.id, fd)
          router.push(`/app/${condominiumSlug}/announcements/${existing.id}`)
          router.refresh()
        } else {
          const { id } = await publishAnnouncement(condominiumSlug, fd)
          router.push(`/app/${condominiumSlug}/announcements/${id}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pool closed for maintenance this weekend"
          required
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the announcement content here…"
          rows={8}
        />
        <p className="text-xs text-muted-foreground">
          Plain text with line breaks is fully supported.
        </p>
      </div>

      {/* Pin toggle */}
      <div className="flex items-center gap-2">
        <input
          id="pinned"
          type="checkbox"
          className="h-4 w-4 rounded border border-input"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
        />
        <Label htmlFor="pinned" className="cursor-pointer">
          Pin this announcement to the top of the feed
        </Label>
      </div>

      {/* File attachments */}
      <div className="space-y-2">
        <Label>Attachments (optional)</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4 mr-1.5" />
            Add files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg"
            onChange={handleFileChange}
          />
        </div>
        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate max-w-xs">{f.name}</span>
                <span className="text-xs shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">Max 50 MB per file.</p>
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              {isEdit ? "Saving…" : "Publishing…"}
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Publish Announcement"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
