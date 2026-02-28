"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { suspendCondominium, reactivateCondominium, deleteCondominium } from "./actions"

interface CondominiumRowActionsProps {
  condominiumId: string
  condominiumName: string
  status: "active" | "suspended"
}

export function CondominiumRowActions({
  condominiumId,
  condominiumName,
  status,
}: CondominiumRowActionsProps) {
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
    <>
      <div className="flex items-center gap-1 justify-end">
        {error && <span className="text-xs text-destructive">{error}</span>}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/super-admin/condominiums/${condominiumId}`}>View</Link>
        </Button>
        {status === "active" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleSuspend}
          >
            Suspend
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleReactivate}
          >
            Reactivate
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => {
            setConfirmName("")
            setShowDelete(true)
          }}
        >
          Delete
        </Button>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Condominium</DialogTitle>
            <DialogDescription>
              This action is irreversible. All members, budgets, and data will
              be permanently deleted. Type{" "}
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
    </>
  )
}
