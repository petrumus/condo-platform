"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Loader2, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generatePhotoUrl } from "@/app/app/[condominiumSlug]/maintenance/actions"

interface PhotoAttachment {
  id: string
  file_name: string
  storage_path: string
}

interface PhotoGalleryProps {
  condominiumSlug: string
  attachments: PhotoAttachment[]
}

interface ResolvedPhoto {
  id: string
  name: string
  url: string
}

export function PhotoGallery({ condominiumSlug, attachments }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<ResolvedPhoto[]>([])
  const [loaded, setLoaded] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function loadPhotos() {
    if (loaded) return
    setError(null)
    startTransition(async () => {
      try {
        const resolved = await Promise.all(
          attachments.map(async (a) => ({
            id: a.id,
            name: a.file_name,
            url: await generatePhotoUrl(condominiumSlug, a.id),
          }))
        )
        setPhotos(resolved)
        setLoaded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load photos.")
      }
    })
  }

  if (!loaded) {
    return (
      <div>
        <Button variant="outline" size="sm" onClick={loadPhotos} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Loading photos…
            </>
          ) : (
            <>
              <ZoomIn className="h-4 w-4 mr-1.5" />
              View {attachments.length} Photo{attachments.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className="relative aspect-square rounded-md overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
            onClick={() => setLightbox(photo.url)}
            title={photo.name}
          >
            <Image
              src={photo.url}
              alt={photo.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Full size preview"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
