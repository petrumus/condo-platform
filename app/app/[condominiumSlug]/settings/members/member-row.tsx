"use client"

import { useState, useTransition } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { updateMemberRole, updateMemberTitle, removeMember } from "./actions"
import type { Tables } from "@/lib/types/database"
import type { MemberRole } from "@/lib/types"

interface MemberRowProps {
  condominiumSlug: string
  member: {
    id: string
    user_id: string
    system_role: MemberRole
    joined_at: string
    functional_title_id: string | null
    user: { email: string; full_name: string | null }
  }
  titles: Pick<Tables<"functional_titles">, "id" | "name">[]
  isCurrentUser: boolean
}

export function MemberRow({
  condominiumSlug,
  member,
  titles,
  isCurrentUser,
}: MemberRowProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRoleChange(newRole: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateMemberRole(condominiumSlug, member.id, newRole as MemberRole)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update role")
      }
    })
  }

  function handleTitleChange(value: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateMemberTitle(
          condominiumSlug,
          member.id,
          value === "none" ? null : value
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update title")
      }
    })
  }

  function handleRemove() {
    if (!confirm(`Remove ${member.user.full_name ?? member.user.email} from this condominium?`)) return
    setError(null)
    startTransition(async () => {
      try {
        await removeMember(condominiumSlug, member.id)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove member")
      }
    })
  }

  return (
    <TableRow className={isPending ? "opacity-60" : ""}>
      <TableCell>
        <div>
          <p className="font-medium text-sm">
            {member.user.full_name ?? "—"}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{member.user.email}</p>
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={member.system_role}
          onValueChange={handleRoleChange}
          disabled={isPending || isCurrentUser}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={member.functional_title_id ?? "none"}
          onValueChange={handleTitleChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="No title" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No title</SelectItem>
            {titles.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(member.joined_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleRemove}
          disabled={isPending || isCurrentUser}
          aria-label="Remove member"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
