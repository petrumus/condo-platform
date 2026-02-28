"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { createBallot, updateBallot } from "@/app/app/[condominiumSlug]/ballots/actions"
import type { BallotFormData, BallotOption, QuestionType } from "@/app/app/[condominiumSlug]/ballots/actions"

interface BallotFormProps {
  condominiumSlug: string
  ballotId?: string // if editing an existing draft
  defaultValues?: Partial<BallotFormData>
  initiatives?: Array<{ id: string; title: string }>
}

function generateOptionId() {
  return Math.random().toString(36).slice(2, 10)
}

export function BallotForm({
  condominiumSlug,
  ballotId,
  defaultValues,
  initiatives = [],
}: BallotFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [questionType, setQuestionType] = useState<QuestionType>(
    defaultValues?.question_type ?? "yes_no"
  )
  const [options, setOptions] = useState<BallotOption[]>(
    defaultValues?.options && defaultValues.options.length > 0
      ? defaultValues.options
      : [
          { id: generateOptionId(), label: "" },
          { id: generateOptionId(), label: "" },
        ]
  )
  const [openAt, setOpenAt] = useState(defaultValues?.open_at ?? "")
  const [closeAt, setCloseAt] = useState(defaultValues?.close_at ?? "")
  const [quorumPct, setQuorumPct] = useState<string>(
    defaultValues?.quorum_pct != null ? String(defaultValues.quorum_pct) : ""
  )
  const [linkedInitiativeId, setLinkedInitiativeId] = useState<string>(
    defaultValues?.linked_initiative_id ?? ""
  )

  function addOption() {
    setOptions((prev) => [...prev, { id: generateOptionId(), label: "" }])
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  function updateOption(id: string, label: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) return setError("Title is required.")
    if (!openAt) return setError("Opening date is required.")
    if (!closeAt) return setError("Closing date is required.")
    if (new Date(closeAt) <= new Date(openAt)) return setError("Closing date must be after opening date.")
    if (questionType !== "yes_no") {
      const filledOptions = options.filter((o) => o.label.trim() !== "")
      if (filledOptions.length < 2) return setError("At least 2 options are required.")
    }

    const data: BallotFormData = {
      title,
      description,
      question_type: questionType,
      options: questionType === "yes_no" ? [] : options.filter((o) => o.label.trim() !== ""),
      open_at: openAt,
      close_at: closeAt,
      quorum_pct: quorumPct ? parseFloat(quorumPct) : null,
      linked_initiative_id: linkedInitiativeId || null,
    }

    startTransition(async () => {
      try {
        if (ballotId) {
          await updateBallot(condominiumSlug, ballotId, data)
          router.push(`/app/${condominiumSlug}/ballots/${ballotId}`)
        } else {
          const result = await createBallot(condominiumSlug, data)
          router.push(`/app/${condominiumSlug}/ballots/${result.id}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.")
      }
    })
  }

  const isEditing = Boolean(ballotId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ballot title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the topic or question in detail"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question type */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Question Type *</Label>
            <div className="flex flex-col gap-2">
              {(["yes_no", "single_choice", "multi_choice"] as QuestionType[]).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="question_type"
                    value={type}
                    checked={questionType === type}
                    onChange={() => setQuestionType(type)}
                    className="accent-foreground"
                  />
                  <span className="text-sm">
                    {type === "yes_no" && "Yes / No"}
                    {type === "single_choice" && "Single Choice (pick one)"}
                    {type === "multi_choice" && "Multiple Choice (pick many)"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Options builder (only for non yes_no) */}
          {questionType !== "yes_no" && (
            <div className="space-y-2">
              <Label>Options *</Label>
              <div className="space-y-2">
                {options.map((option, idx) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(option.id)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Option
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="open_at">Opens at *</Label>
              <Input
                id="open_at"
                type="datetime-local"
                value={openAt}
                onChange={(e) => setOpenAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close_at">Closes at *</Label>
              <Input
                id="close_at"
                type="datetime-local"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quorum_pct">Quorum Threshold (%) — optional</Label>
            <Input
              id="quorum_pct"
              type="number"
              min="1"
              max="100"
              step="0.1"
              value={quorumPct}
              onChange={(e) => setQuorumPct(e.target.value)}
              placeholder="e.g. 51"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for no quorum requirement.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Linked initiative */}
      {initiatives.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Label htmlFor="linked_initiative">Link to Initiative — optional</Label>
            <select
              id="linked_initiative"
              value={linkedInitiativeId}
              onChange={(e) => setLinkedInitiativeId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— None —</option>
              {initiatives.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEditing ? "Save Changes" : "Create Ballot"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
