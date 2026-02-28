"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateMemberRole, removeMember } from "../actions"

interface MemberRowProps {
  condominiumId: string
  member: {
    id: string
    system_role: "admin" | "user"
    joined_at: string
    profiles: { email: string | null; full_name: string | null } | null
  }
}

export function MemberRow({ condominiumId, member }: MemberRowProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRoleChange(role: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateMemberRole(member.id, condominiumId, role as "admin" | "user")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update role")
      }
    })
  }

  function handleRemove() {
    if (
      !confirm(
        `Remove ${member.profiles?.full_name ?? member.profiles?.email ?? "this member"}?`
      )
    )
      return
    setError(null)
    startTransition(async () => {
      try {
        await removeMember(member.id, condominiumId)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove member")
      }
    })
  }

  return (
    <tr className={`border-b last:border-0 ${isPending ? "opacity-60" : ""}`}>
      <td className="px-4 py-3">
        <p className="text-sm font-medium">
          {member.profiles?.full_name ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {member.profiles?.email ?? "Unknown"}
        </p>
        {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <Select
          value={member.system_role}
          onValueChange={handleRoleChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(member.joined_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={handleRemove}
        >
          Remove
        </Button>
      </td>
    </tr>
  )
}
