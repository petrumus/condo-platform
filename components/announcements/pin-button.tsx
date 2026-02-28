"use client"

import { useTransition } from "react"
import { Pin, PinOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { togglePin } from "@/app/app/[condominiumSlug]/announcements/actions"

interface PinButtonProps {
  condominiumSlug: string
  announcementId: string
  pinned: boolean
}

export function PinButton({ condominiumSlug, announcementId, pinned }: PinButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await togglePin(condominiumSlug, announcementId, pinned)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : pinned ? (
        <PinOff className="h-4 w-4 mr-1.5" />
      ) : (
        <Pin className="h-4 w-4 mr-1.5" />
      )}
      {pinned ? "Unpin" : "Pin"}
    </Button>
  )
}
