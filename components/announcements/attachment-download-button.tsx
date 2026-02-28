"use client"

import { useTransition } from "react"
import { Download, Loader2 } from "lucide-react"
import { generateAttachmentDownloadUrl } from "@/app/app/[condominiumSlug]/announcements/actions"

interface AttachmentDownloadButtonProps {
  condominiumSlug: string
  attachmentId: string
  fileName: string
}

export function AttachmentDownloadButton({
  condominiumSlug,
  attachmentId,
  fileName,
}: AttachmentDownloadButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    startTransition(async () => {
      const url = await generateAttachmentDownloadUrl(condominiumSlug, attachmentId)
      window.open(url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <Download className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate max-w-xs">{fileName}</span>
    </button>
  )
}
