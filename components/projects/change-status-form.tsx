"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  changeProjectStatus,
  type ProjectStatus,
} from "@/app/app/[condominiumSlug]/projects/actions"

const NEXT_STATUS: Record<ProjectStatus, { value: ProjectStatus; label: string } | null> = {
  proposed: { value: "approved", label: "Mark as Approved" },
  approved: { value: "in_progress", label: "Mark as In Progress" },
  in_progress: { value: "completed", label: "Mark as Completed" },
  completed: { value: "archived", label: "Archive Project" },
  archived: null,
}

interface ChangeStatusFormProps {
  condominiumSlug: string
  projectId: string
  currentStatus: ProjectStatus
}

export function ChangeStatusForm({
  condominiumSlug,
  projectId,
  currentStatus,
}: ChangeStatusFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const next = NEXT_STATUS[currentStatus]
  if (!next) return null

  function handleAdvance() {
    setError(null)
    startTransition(async () => {
      try {
        await changeProjectStatus(condominiumSlug, projectId, currentStatus, next!.value)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update status.")
      }
    })
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleAdvance}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Updating…
          </>
        ) : (
          next.label
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
