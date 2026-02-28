"use client"

import { useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { revokeInvitation } from "./actions"
import type { Tables } from "@/lib/types/database"

interface PendingInvitationsProps {
  condominiumSlug: string
  invitations: Pick<Tables<"invitations">, "id" | "email" | "role" | "created_at">[]
}

export function PendingInvitations({ condominiumSlug, invitations }: PendingInvitationsProps) {
  const [isPending, startTransition] = useTransition()

  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invitations.</p>
  }

  function handleRevoke(id: string, email: string) {
    if (!confirm(`Revoke invitation for ${email}?`)) return
    startTransition(async () => {
      await revokeInvitation(condominiumSlug, id)
    })
  }

  return (
    <div className="space-y-2">
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium">{inv.email}</span>
            <Badge variant="outline" className="capitalize text-xs">
              {inv.role}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Sent {new Date(inv.created_at).toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => handleRevoke(inv.id, inv.email)}
            disabled={isPending}
            aria-label="Revoke invitation"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}
