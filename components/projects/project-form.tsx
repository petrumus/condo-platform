"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  createProject,
  updateProject,
  type ProjectFormData,
  type ProjectStatus,
} from "@/app/app/[condominiumSlug]/projects/actions"

interface ProjectFormProps {
  condominiumSlug: string
  mode: "create" | "edit"
  projectId?: string
  initialData?: Partial<ProjectFormData>
}

const EMPTY: ProjectFormData = {
  title: "",
  description: "",
  category: "",
  status: "proposed",
  estimated_cost: "",
  actual_cost: "",
  start_date: "",
  end_date: "",
  responsible_person: "",
}

export function ProjectForm({
  condominiumSlug,
  mode,
  projectId,
  initialData,
}: ProjectFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<ProjectFormData>({ ...EMPTY, ...initialData })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function set(field: keyof ProjectFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError("Title is required.")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        if (mode === "create") {
          const { id } = await createProject(condominiumSlug, form)
          router.push(`/app/${condominiumSlug}/projects/${id}`)
        } else if (mode === "edit" && projectId) {
          await updateProject(condominiumSlug, projectId, form)
          router.push(`/app/${condominiumSlug}/projects/${projectId}`)
          router.refresh()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Facade Renovation"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the project scope and goals…"
          rows={4}
        />
      </div>

      {/* Category + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.category || "__none__"}
            onValueChange={(v) => set("category", v === "__none__" ? "" : v)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {PROJECT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => set("status", v as ProjectStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Costs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="estimated_cost">Estimated Cost</Label>
          <Input
            id="estimated_cost"
            type="number"
            min="0"
            step="0.01"
            value={form.estimated_cost}
            onChange={(e) => set("estimated_cost", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="actual_cost">Actual Cost</Label>
          <Input
            id="actual_cost"
            type="number"
            min="0"
            step="0.01"
            value={form.actual_cost}
            onChange={(e) => set("actual_cost", e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">Expected End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </div>
      </div>

      {/* Responsible person */}
      <div className="space-y-1.5">
        <Label htmlFor="responsible_person">Responsible Person</Label>
        <Input
          id="responsible_person"
          value={form.responsible_person}
          onChange={(e) => set("responsible_person", e.target.value)}
          placeholder="e.g. John Smith / Administrator"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : mode === "create" ? (
            "Create Project"
          ) : (
            "Save Changes"
          )}
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
