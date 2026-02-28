"use client"

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { postProjectUpdate } from "@/app/app/[condominiumSlug]/projects/actions"

interface PostUpdateFormProps {
  condominiumSlug: string
  projectId: string
}

export function PostUpdateForm({ condominiumSlug, projectId }: PostUpdateFormProps) {
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await postProjectUpdate(condominiumSlug, projectId, body)
        setBody("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post update.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a progress update…"
        rows={3}
        disabled={isPending}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Posting…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1.5" />
              Post Update
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
