"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { createNotification } from "@/lib/notifications/create-notification"
import { logAction } from "@/lib/audit/log-action"
import { triggerN8nWebhook } from "@/lib/n8n/trigger-webhook"

export type InitiativeStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "converted"

export const INITIATIVE_CATEGORIES = [
  "Infrastructure",
  "Amenities",
  "Safety",
  "Environment",
  "Community",
  "Administrative",
  "Other",
] as const

export interface InitiativeFormData {
  title: string
  description: string
  category: string
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

async function requireMember(condominiumSlug: string) {
  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  return { user, condominium, role }
}

async function requireAdmin(condominiumSlug: string) {
  const { user, condominium, role } = await requireMember(condominiumSlug)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/initiatives`)
  return { user, condominium }
}

// ─── Member actions ────────────────────────────────────────────────────────────

export async function submitInitiative(
  condominiumSlug: string,
  data: InitiativeFormData
): Promise<{ id: string }> {
  const { user, condominium } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  const { data: initiative, error } = await supabase
    .from("initiatives")
    .insert({
      condominium_id: condominium.id,
      title: data.title.trim(),
      description: data.description.trim() || null,
      category: data.category.trim() || null,
      status: "pending_review",
      submitter_id: user.id,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/initiatives`)
  return initiative
}

// ─── Admin actions ─────────────────────────────────────────────────────────────

export async function approveInitiative(
  condominiumSlug: string,
  initiativeId: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch submitter_id and title before updating
  const { data: initiative } = await supabase
    .from("initiatives")
    .select("submitter_id, title")
    .eq("id", initiativeId)
    .single()

  const { error } = await supabase
    .from("initiatives")
    .update({ status: "approved", admin_notes: null })
    .eq("id", initiativeId)

  if (error) throw new Error(error.message)

  // Notify submitter
  if (initiative) {
    await createNotification({
      userId: initiative.submitter_id,
      condominiumId: condominium.id,
      type: "initiative_status",
      title: "Initiative approved",
      body: `Your initiative "${initiative.title}" has been approved.`,
      linkUrl: `/app/${condominiumSlug}/initiatives/${initiativeId}`,
    })

    // Fire-and-forget email via n8n
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", initiative.submitter_id)
      .single()
    if (profile?.email) {
      void triggerN8nWebhook("initiative_status", {
        user_email: profile.email,
        initiative_title: initiative.title,
        new_status: "approved",
        rejection_reason: null,
      })
    }
  }

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "initiative.approved",
    entityType: "initiative",
    entityId: initiativeId,
    metadata: initiative ? { title: initiative.title } : null,
  })

  revalidatePath(`/app/${condominiumSlug}/initiatives`)
  revalidatePath(`/app/${condominiumSlug}/initiatives/${initiativeId}`)
  revalidatePath(`/app/${condominiumSlug}/initiatives/review`)
}

export async function rejectInitiative(
  condominiumSlug: string,
  initiativeId: string,
  reason: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch submitter_id and title before updating
  const { data: initiative } = await supabase
    .from("initiatives")
    .select("submitter_id, title")
    .eq("id", initiativeId)
    .single()

  const { error } = await supabase
    .from("initiatives")
    .update({ status: "rejected", admin_notes: reason.trim() || null })
    .eq("id", initiativeId)

  if (error) throw new Error(error.message)

  // Notify submitter
  if (initiative) {
    await createNotification({
      userId: initiative.submitter_id,
      condominiumId: condominium.id,
      type: "initiative_status",
      title: "Initiative not approved",
      body: reason.trim()
        ? `Your initiative "${initiative.title}" was not approved: ${reason.trim()}`
        : `Your initiative "${initiative.title}" was not approved.`,
      linkUrl: `/app/${condominiumSlug}/initiatives/${initiativeId}`,
    })

    // Fire-and-forget email via n8n
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", initiative.submitter_id)
      .single()
    if (profile?.email) {
      void triggerN8nWebhook("initiative_status", {
        user_email: profile.email,
        initiative_title: initiative.title,
        new_status: "rejected",
        rejection_reason: reason.trim() || null,
      })
    }
  }

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "initiative.rejected",
    entityType: "initiative",
    entityId: initiativeId,
    metadata: { title: initiative?.title ?? null, reason: reason.trim() || null },
  })

  revalidatePath(`/app/${condominiumSlug}/initiatives`)
  revalidatePath(`/app/${condominiumSlug}/initiatives/${initiativeId}`)
  revalidatePath(`/app/${condominiumSlug}/initiatives/review`)
}

export async function convertToProject(
  condominiumSlug: string,
  initiativeId: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch initiative data for pre-filling
  const { data: initiative, error: fetchError } = await supabase
    .from("initiatives")
    .select("title, description, category")
    .eq("id", initiativeId)
    .single()

  if (fetchError || !initiative) throw new Error("Initiative not found.")

  // Mark initiative as converted
  const { error } = await supabase
    .from("initiatives")
    .update({ status: "converted" })
    .eq("id", initiativeId)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "initiative.converted",
    entityType: "initiative",
    entityId: initiativeId,
    metadata: { title: initiative.title, converted_to: "project" },
  })

  revalidatePath(`/app/${condominiumSlug}/initiatives`)
  revalidatePath(`/app/${condominiumSlug}/initiatives/${initiativeId}`)

  // Redirect to new project form pre-filled with initiative data
  const params = new URLSearchParams({
    title: initiative.title,
    description: initiative.description ?? "",
    category: initiative.category ?? "",
    from_initiative: initiativeId,
  })
  redirect(`/app/${condominiumSlug}/projects/new?${params.toString()}`)
}

export async function convertToBallot(
  condominiumSlug: string,
  initiativeId: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch initiative data for pre-filling
  const { data: initiative, error: fetchError } = await supabase
    .from("initiatives")
    .select("title, description")
    .eq("id", initiativeId)
    .single()

  if (fetchError || !initiative) throw new Error("Initiative not found.")

  // Mark initiative as converted
  const { error } = await supabase
    .from("initiatives")
    .update({ status: "converted" })
    .eq("id", initiativeId)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "initiative.converted",
    entityType: "initiative",
    entityId: initiativeId,
    metadata: { title: initiative.title, converted_to: "ballot" },
  })

  revalidatePath(`/app/${condominiumSlug}/initiatives`)
  revalidatePath(`/app/${condominiumSlug}/initiatives/${initiativeId}`)

  // Redirect to new ballot form pre-filled with initiative data
  const params = new URLSearchParams({
    title: initiative.title,
    description: initiative.description ?? "",
    from_initiative: initiativeId,
  })
  redirect(`/app/${condominiumSlug}/ballots/new?${params.toString()}`)
}
