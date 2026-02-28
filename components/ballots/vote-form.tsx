"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { castVote } from "@/app/app/[condominiumSlug]/ballots/actions"
import type { BallotOption, QuestionType } from "@/app/app/[condominiumSlug]/ballots/actions"

interface VoteFormProps {
  condominiumSlug: string
  ballotId: string
  questionType: QuestionType
  options: BallotOption[]
}

const YES_NO_OPTIONS: BallotOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
]

export function VoteForm({ condominiumSlug, ballotId, questionType, options }: VoteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const displayOptions = questionType === "yes_no" ? YES_NO_OPTIONS : options
  const isMulti = questionType === "multi_choice"

  function toggleOption(id: string) {
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
      )
    } else {
      setSelected([id])
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (selected.length === 0) {
      setError("Please select at least one option.")
      return
    }

    startTransition(async () => {
      try {
        await castVote(condominiumSlug, ballotId, selected)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cast vote.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {displayOptions.map((option) => {
          const isSelected = selected.includes(option.id)
          return (
            <label
              key={option.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                isSelected
                  ? "border-foreground bg-foreground/5"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <input
                type={isMulti ? "checkbox" : "radio"}
                name="ballot_option"
                value={option.id}
                checked={isSelected}
                onChange={() => toggleOption(option.id)}
                className="accent-foreground"
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          )
        })}
      </div>

      {isMulti && (
        <p className="text-xs text-muted-foreground">You may select multiple options.</p>
      )}

      <Button type="submit" disabled={isPending || selected.length === 0}>
        {isPending ? "Submitting vote…" : "Submit Vote"}
      </Button>
    </form>
  )
}
