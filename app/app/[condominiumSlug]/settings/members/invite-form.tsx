"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { inviteMember } from "./actions"
import type { MemberRole } from "@/lib/types"

interface InviteFormProps {
  condominiumSlug: string
}

export function InviteForm({ condominiumSlug }: InviteFormProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<MemberRole>("user")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      try {
        await inviteMember(condominiumSlug, email, role)
        setEmail("")
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send invitation")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="member@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="w-full sm:w-36 space-y-1.5">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as MemberRole)}
          disabled={isPending}
        >
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending} className="sm:mb-0">
        {isPending ? "Sending…" : "Send Invite"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Invitation sent!</p>}
    </form>
  )
}
