"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTitle } from "./actions"

interface CreateTitleFormProps {
  condominiumSlug: string
  nextSortOrder: number
}

export function CreateTitleForm({ condominiumSlug, nextSortOrder }: CreateTitleFormProps) {
  const [name, setName] = useState("")
  const [sortOrder, setSortOrder] = useState(nextSortOrder)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)

    startTransition(async () => {
      try {
        await createTitle(condominiumSlug, name, sortOrder)
        setName("")
        setSortOrder((s) => s + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create title")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="title-name">Title name</Label>
        <Input
          id="title-name"
          placeholder="e.g. Secretary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="w-full sm:w-28 space-y-1.5">
        <Label htmlFor="title-sort">Sort order</Label>
        <Input
          id="title-sort"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending || !name.trim()}>
        {isPending ? "Creating…" : "Add Title"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
