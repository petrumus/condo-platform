"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"

export type ProjectStatus =
  | "proposed"
  | "approved"
  | "in_progress"
  | "completed"
  | "archived"

export type ProjectCategory =
  | "Infrastructure"
  | "Landscaping"
  | "Legal"
  | "Administrative"
  | "Other"

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  "Infrastructure",
  "Landscaping",
  "Legal",
  "Administrative",
  "Other",
]

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "proposed", label: "Proposed" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
]

// Valid status transitions: from → allowed next statuses
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  proposed: ["approved"],
  approved: ["in_progress"],
  in_progress: ["completed"],
  completed: ["archived"],
  archived: [],
}

export interface ProjectFormData {
  title: string
  description: string
  category: string
  status: ProjectStatus
  estimated_cost: string
  actual_cost: string
  start_date: string
  end_date: string
  responsible_person: string
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin(condominiumSlug: string) {
  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/projects`)

  return { user, condominium }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createProject(
  condominiumSlug: string,
  data: ProjectFormData
): Promise<{ id: string }> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      condominium_id: condominium.id,
      title: data.title.trim(),
      description: data.description.trim() || null,
      category: data.category || null,
      status: data.status,
      estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : null,
      actual_cost: data.actual_cost ? parseFloat(data.actual_cost) : null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      responsible_person: data.responsible_person.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/projects`)
  return project
}

export async function updateProject(
  condominiumSlug: string,
  projectId: string,
  data: ProjectFormData
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("projects")
    .update({
      title: data.title.trim(),
      description: data.description.trim() || null,
      category: data.category || null,
      status: data.status,
      estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : null,
      actual_cost: data.actual_cost ? parseFloat(data.actual_cost) : null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      responsible_person: data.responsible_person.trim() || null,
    })
    .eq("id", projectId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/projects`)
  revalidatePath(`/app/${condominiumSlug}/projects/${projectId}`)
  revalidatePath(`/app/${condominiumSlug}/projects/${projectId}/edit`)
}

export async function changeProjectStatus(
  condominiumSlug: string,
  projectId: string,
  currentStatus: ProjectStatus,
  newStatus: ProjectStatus
): Promise<void> {
  await requireAdmin(condominiumSlug)

  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition from "${currentStatus}" to "${newStatus}".`
    )
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("projects")
    .update({ status: newStatus })
    .eq("id", projectId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/projects`)
  revalidatePath(`/app/${condominiumSlug}/projects/${projectId}`)
}

export async function postProjectUpdate(
  condominiumSlug: string,
  projectId: string,
  body: string
): Promise<void> {
  const { user } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase.from("project_updates").insert({
    project_id: projectId,
    body: body.trim(),
    created_by: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/projects/${projectId}`)
}
