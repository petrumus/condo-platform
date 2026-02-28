"use client"

import { useState, useTransition } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteAnnouncement } from "@/app/app/[condominiumSlug]/announcements/actions"

interface DeleteAnnouncementButtonProps {
  condominiumSlug: string
  announcementId: string
  announcementTitle: string
}

export function DeleteAnnouncementButton({
  condominiumSlug,
  announcementId,
  announcementTitle,
}: DeleteAnnouncementButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteAnnouncement(condominiumSlug, announcementId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete.")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Announcement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{announcementTitle}&rdquo;? This action cannot
            be undone and all attachments will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            Delete Announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
