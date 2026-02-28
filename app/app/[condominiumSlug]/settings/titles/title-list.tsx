"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { updateTitle, deleteTitle } from "./actions"
import type { Tables } from "@/lib/types/database"

const BUILT_IN_TITLES = ["Administrator", "Councilor", "Auditor", "Accountant"]

interface TitleListProps {
  condominiumSlug: string
  titles: Tables<"functional_titles">[]
}

interface EditState {
  id: string
  name: string
  sortOrder: number
}

export function TitleList({ condominiumSlug, titles }: TitleListProps) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<EditState | null>(null)
  const [error, setError] = useState<string | null>(null)

  function startEdit(title: Tables<"functional_titles">) {
    setEditing({ id: title.id, name: title.name, sortOrder: title.sort_order })
    setError(null)
  }

  function handleSave() {
    if (!editing) return
    setError(null)
    startTransition(async () => {
      try {
        await updateTitle(condominiumSlug, editing.id, editing.name, editing.sortOrder)
        setEditing(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update title")
      }
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete title "${name}"? Members with this title will have it removed.`)) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteTitle(condominiumSlug, id)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete title")
      }
    })
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {titles.map((title) => {
        const isBuiltIn = BUILT_IN_TITLES.includes(title.name)
        const isEditing = editing?.id === title.id

        return (
          <div
            key={title.id}
            className="flex items-center gap-3 rounded-md border px-3 py-2"
          >
            {isEditing ? (
              <>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  disabled={isBuiltIn || isPending}
                  className="h-7 text-sm flex-1"
                />
                <Input
                  type="number"
                  value={editing.sortOrder}
                  onChange={(e) =>
                    setEditing({ ...editing, sortOrder: Number(e.target.value) })
                  }
                  disabled={isPending}
                  className="h-7 text-sm w-20"
                  aria-label="Sort order"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSave}
                  disabled={isPending}
                  aria-label="Save"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditing(null)}
                  disabled={isPending}
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{title.name}</span>
                <span className="text-xs text-muted-foreground w-16">
                  Order: {title.sort_order}
                </span>
                {isBuiltIn && (
                  <Badge variant="secondary" className="text-xs">
                    Built-in
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => startEdit(title)}
                  disabled={isPending}
                  aria-label="Edit title"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(title.id, title.name)}
                  disabled={isPending || isBuiltIn}
                  aria-label="Delete title"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
