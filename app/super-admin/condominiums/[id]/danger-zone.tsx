"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { suspendCondominium, reactivateCondominium, deleteCondominium } from "../actions"

interface DangerZoneProps {
  condominiumId: string
  condominiumName: string
  status: "active" | "suspended"
}

export function DangerZone({
  condominiumId,
  condominiumName,
  status,
}: DangerZoneProps) {
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSuspend() {
    setError(null)
    startTransition(async () => {
      try {
        await suspendCondominium(condominiumId)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to suspend")
      }
    })
  }

  function handleReactivate() {
    setError(null)
    startTransition(async () => {
      try {
        await reactivateCondominium(condominiumId)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reactivate")
      }
    })
  }

  function handleDelete() {
    if (confirmName !== condominiumName) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteCondominium(condominiumId)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete")
      }
    })
  }

  return (
    <div className="border border-destructive/30 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>

      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <p className="font-medium text-sm">
            {status === "active" ? "Suspend condominium" : "Reactivate condominium"}
          </p>
          <p className="text-xs text-muted-foreground">
            {status === "active"
              ? "Members will be redirected to a suspended page when they try to access the workspace."
              : "Restore access for all members of this condominium."}
          </p>
        </div>
        {status === "active" ? (
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={handleSuspend}
          >
            Suspend
          </Button>
        ) : (
          <Button variant="outline" disabled={isPending} onClick={handleReactivate}>
            Reactivate
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between py-3">
        <div>
          <p className="font-medium text-sm">Delete condominium</p>
          <p className="text-xs text-muted-foreground">
            Permanently delete this condominium and all its data. This cannot be undone.
          </p>
        </div>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            setConfirmName("")
            setShowDelete(true)
          }}
        >
          Delete
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Condominium</DialogTitle>
            <DialogDescription>
              This action is irreversible. All members, budgets, projects,
              documents, and data will be permanently deleted. Type{" "}
              <strong>{condominiumName}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={condominiumName}
            disabled={isPending}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmName !== condominiumName || isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
