"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, FolderKanban, Vote, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  approveInitiative,
  rejectInitiative,
  convertToProject,
  convertToBallot,
} from "@/app/app/[condominiumSlug]/initiatives/actions"

interface AdminInitiativeActionsProps {
  condominiumSlug: string
  initiativeId: string
  currentStatus: string
}

export function AdminInitiativeActions({
  condominiumSlug,
  initiativeId,
  currentStatus,
}: AdminInitiativeActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Reject modal state
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, startRejectTransition] = useTransition()

  const isActionable = currentStatus === "pending_review" || currentStatus === "approved"

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      try {
        await approveInitiative(condominiumSlug, initiativeId)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve.")
      }
    })
  }

  function handleReject() {
    setError(null)
    startRejectTransition(async () => {
      try {
        await rejectInitiative(condominiumSlug, initiativeId, rejectReason)
        setRejectOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject.")
      }
    })
  }

  function handleConvertToProject() {
    setError(null)
    startTransition(async () => {
      try {
        await convertToProject(condominiumSlug, initiativeId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to convert.")
      }
    })
  }

  function handleConvertToBallot() {
    setError(null)
    startTransition(async () => {
      try {
        await convertToBallot(condominiumSlug, initiativeId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to convert.")
      }
    })
  }

  if (currentStatus === "converted" || currentStatus === "rejected") {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {isActionable && (
          <div className="flex flex-wrap gap-2">
            {currentStatus === "pending_review" && (
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                )}
                Approve
              </Button>
            )}

            {/* Reject dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={isPending}>
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Initiative</DialogTitle>
                  <DialogDescription>
                    Optionally provide a reason for the submitter.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5 py-2">
                  <Label htmlFor="reject-reason">Reason (optional)</Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this initiative is being rejected…"
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRejectOpen(false)}
                    disabled={isRejecting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isRejecting}
                  >
                    {isRejecting ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : null}
                    Confirm Rejection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Convert actions — available when approved */}
        {currentStatus === "approved" && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleConvertToProject}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FolderKanban className="h-4 w-4 mr-1.5" />
              )}
              Convert to Project
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleConvertToBallot}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Vote className="h-4 w-4 mr-1.5" />
              )}
              Convert to Ballot
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
