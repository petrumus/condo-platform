"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateCondominium } from "../actions"

interface EditCondominiumFormProps {
  id: string
  name: string
  address: string | null
  description: string | null
}

export function EditCondominiumForm({
  id,
  name,
  address,
  description,
}: EditCondominiumFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateCondominium(id, formData)
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save changes")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">Name *</Label>
        <Input
          id="edit-name"
          name="name"
          defaultValue={name}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-address">Address</Label>
        <Input
          id="edit-address"
          name="address"
          defaultValue={address ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          name="description"
          defaultValue={description ?? ""}
          rows={3}
          disabled={isPending}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Changes saved.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  )
}
