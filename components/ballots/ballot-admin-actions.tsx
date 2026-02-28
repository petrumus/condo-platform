"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  openBallot,
  closeBallot,
  publishResults,
  deleteBallot,
} from "@/app/app/[condominiumSlug]/ballots/actions"

interface BallotAdminActionsProps {
  condominiumSlug: string
  ballotId: string
  currentStatus: string
}

export function BallotAdminActions({
  condominiumSlug,
  ballotId,
  currentStatus,
}: BallotAdminActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function run(action: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await action()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.")
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {currentStatus === "draft" && (
          <>
            <Button
              size="sm"
              onClick={() => run(() => openBallot(condominiumSlug, ballotId))}
              disabled={isPending}
            >
              Open Ballot
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/app/${condominiumSlug}/ballots/${ballotId}/edit`)}
              disabled={isPending}
            >
              Edit
            </Button>
            {!confirmDelete ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
              >
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Are you sure?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => run(() => deleteBallot(condominiumSlug, ballotId))}
                  disabled={isPending}
                >
                  Yes, delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}

        {currentStatus === "open" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => run(() => closeBallot(condominiumSlug, ballotId))}
            disabled={isPending}
          >
            Close Ballot
          </Button>
        )}

        {currentStatus === "closed" && (
          <Button
            size="sm"
            onClick={() => run(() => publishResults(condominiumSlug, ballotId))}
            disabled={isPending}
          >
            Publish Results
          </Button>
        )}

        {currentStatus === "results_published" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(`/app/${condominiumSlug}/ballots/${ballotId}/results`)
            }
            disabled={isPending}
          >
            View Results Page
          </Button>
        )}
      </div>
    </div>
  )
}
