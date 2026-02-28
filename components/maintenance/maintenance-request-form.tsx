"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MAINTENANCE_CATEGORIES,
  submitMaintenanceRequest,
} from "@/app/app/[condominiumSlug]/maintenance/actions"

interface MaintenanceRequestFormProps {
  condominiumSlug: string
}

export function MaintenanceRequestForm({ condominiumSlug }: MaintenanceRequestFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotos((prev) => [...prev, ...files])
    // Reset input so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    // Append photos
    photos.forEach((photo) => formData.append("photos", photo))

    startTransition(async () => {
      try {
        const { id } = await submitMaintenanceRequest(condominiumSlug, formData)
        router.push(`/app/${condominiumSlug}/maintenance/${id}`)
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
          name="title"
          placeholder="e.g. Leaking pipe in hallway B"
          required
          disabled={isPending}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the issue in detail…"
          rows={4}
          disabled={isPending}
        />
      </div>

      {/* Category & Priority (2-col) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="__none__" disabled={isPending}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {MAINTENANCE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="medium" disabled={isPending}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g. Floor 3, stairwell A"
          disabled={isPending}
        />
      </div>

      {/* Photo attachments */}
      <div className="space-y-2">
        <Label>Photos (optional)</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Add Photos
          </Button>
          <span className="text-xs text-muted-foreground">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} selected · max 20 MB each
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-md border bg-muted px-2.5 py-1 text-xs"
              >
                <span className="max-w-[150px] truncate">{photo.name}</span>
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Request"
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
