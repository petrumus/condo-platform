"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addUnitOwner, removeUnitOwner } from "@/app/app/[condominiumSlug]/settings/units/actions"
import type { Tables } from "@/lib/types/database"

type UnitOwner = Tables<"unit_owners">
type Member = { user_id: string; full_name: string | null; email: string | null }

interface UnitOwnersDialogProps {
  condominiumSlug: string
  unitId: string
  unitNumber: string
  owners: UnitOwner[]
  members: Member[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function UnitOwnersDialog({
  condominiumSlug,
  unitId,
  unitNumber,
  owners,
  members,
  open,
  onOpenChange,
}: UnitOwnersDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Add owner form state
  const [ownerType, setOwnerType] = useState<"member" | "unregistered">("member")
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  const [ownerName, setOwnerName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  function handleOpenChange(val: boolean) {
    if (!val) {
      setError(null)
      setSuccess(null)
      setSelectedMemberId("")
      setOwnerName("")
      setOwnerEmail("")
    }
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  function handleAddOwner(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let userId: string | null = null
    let name = ownerName.trim()
    let email: string | null = ownerEmail.trim() || null

    if (ownerType === "member") {
      if (!selectedMemberId) {
        setError("Please select a member.")
        return
      }
      const member = members.find((m) => m.user_id === selectedMemberId)
      if (!member) {
        setError("Member not found.")
        return
      }
      userId = member.user_id
      name = name || member.full_name || member.email || "Member"
      email = email || member.email
    } else {
      if (!name) {
        setError("Owner name is required.")
        return
      }
    }

    startTransition(async () => {
      try {
        await addUnitOwner(condominiumSlug, unitId, {
          userId,
          ownerName: name,
          ownerEmail: email,
        })
        setSelectedMemberId("")
        setOwnerName("")
        setOwnerEmail("")
        showSuccess("Owner added.")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add owner.")
      }
    })
  }

  function handleRemoveOwner(ownerId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removeUnitOwner(condominiumSlug, ownerId)
        showSuccess("Owner removed.")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove owner.")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">
            <Users className="h-4 w-4 mr-1.5" />
            Owners
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Owners — Unit {unitNumber}</DialogTitle>
          <DialogDescription>
            Manage registered and unregistered owners for this unit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 rounded-md bg-green-50 px-3 py-2">{success}</p>
          )}

          {/* Current owners list */}
          {owners.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Owners</p>
              {owners.map((owner) => (
                <div
                  key={owner.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{owner.owner_name}</p>
                    {owner.owner_email && (
                      <p className="text-xs text-muted-foreground truncate">{owner.owner_email}</p>
                    )}
                    {owner.user_id && (
                      <p className="text-xs text-muted-foreground">Linked to account</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveOwner(owner.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove owner</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No owners registered yet.</p>
          )}

          <Separator />

          {/* Add owner form */}
          <form onSubmit={handleAddOwner} className="space-y-3">
            <p className="text-sm font-medium">Add Owner</p>

            {/* Owner type toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={ownerType === "member" ? "default" : "outline"}
                onClick={() => setOwnerType("member")}
              >
                Registered Member
              </Button>
              <Button
                type="button"
                size="sm"
                variant={ownerType === "unregistered" ? "default" : "outline"}
                onClick={() => setOwnerType("unregistered")}
              >
                Unregistered
              </Button>
            </div>

            {ownerType === "member" ? (
              <div className="space-y-1.5">
                <Label htmlFor="member-select">Member *</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger id="member-select">
                    <SelectValue placeholder="Select a member…" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.full_name ?? m.email ?? m.user_id}
                        {m.email && m.full_name ? ` (${m.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1.5">
                  <Label htmlFor="member-display-name">Display Name (optional)</Label>
                  <Input
                    id="member-display-name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Leave blank to use member's name"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="owner-name">Owner Name *</Label>
                  <Input
                    id="owner-name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    required={ownerType === "unregistered"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-email">Email (optional)</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
            )}

            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Add Owner
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
