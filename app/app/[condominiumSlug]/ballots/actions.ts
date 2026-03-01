"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { createNotificationForAllMembers } from "@/lib/notifications/create-notification"
import { logAction } from "@/lib/audit/log-action"
import { triggerN8nWebhook } from "@/lib/n8n/trigger-webhook"

export type BallotStatus = "draft" | "open" | "closed" | "results_published"
export type QuestionType = "yes_no" | "single_choice" | "multi_choice"

export interface BallotOption {
  id: string
  label: string
}

export interface BallotFormData {
  title: string
  description: string
  question_type: QuestionType
  options: BallotOption[]
  open_at: string
  close_at: string
  quorum_pct: number | null
  linked_initiative_id: string | null
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
  if (role !== "admin") redirect(`/app/${condominiumSlug}/ballots`)
  return { user, condominium }
}

// ─── Admin actions ─────────────────────────────────────────────────────────────

export async function createBallot(
  condominiumSlug: string,
  data: BallotFormData
): Promise<{ id: string }> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // For yes_no type, options are implicit — store empty array
  const options =
    data.question_type === "yes_no"
      ? []
      : data.options.filter((o) => o.label.trim() !== "")

  const { data: ballot, error } = await supabase
    .from("ballots")
    .insert({
      condominium_id: condominium.id,
      title: data.title.trim(),
      description: data.description.trim() || null,
      question_type: data.question_type,
      options: options as unknown as import("@/lib/types/database").Json,
      open_at: data.open_at,
      close_at: data.close_at,
      quorum_pct: data.quorum_pct,
      linked_initiative_id: data.linked_initiative_id || null,
      status: "draft" as const,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "ballot.created",
    entityType: "ballot",
    entityId: ballot.id,
    metadata: { title: data.title.trim(), question_type: data.question_type },
  })

  revalidatePath(`/app/${condominiumSlug}/ballots`)
  return ballot
}

export async function updateBallot(
  condominiumSlug: string,
  ballotId: string,
  data: BallotFormData
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Verify ballot is still in draft
  const { data: existing } = await supabase
    .from("ballots")
    .select("status")
    .eq("id", ballotId)
    .single()

  if (!existing || existing.status !== "draft") {
    throw new Error("Only draft ballots can be edited.")
  }

  const options =
    data.question_type === "yes_no"
      ? []
      : data.options.filter((o) => o.label.trim() !== "")

  const { error } = await supabase
    .from("ballots")
    .update({
      title: data.title.trim(),
      description: data.description.trim() || null,
      question_type: data.question_type,
      options: options as unknown as import("@/lib/types/database").Json,
      open_at: data.open_at,
      close_at: data.close_at,
      quorum_pct: data.quorum_pct,
      linked_initiative_id: data.linked_initiative_id || null,
    })
    .eq("id", ballotId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/ballots`)
  revalidatePath(`/app/${condominiumSlug}/ballots/${ballotId}`)
}

export async function openBallot(
  condominiumSlug: string,
  ballotId: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch ballot title before updating
  const { data: ballot } = await supabase
    .from("ballots")
    .select("title, close_at")
    .eq("id", ballotId)
    .single()

  const { error } = await supabase
    .from("ballots")
    .update({ status: "open" })
    .eq("id", ballotId)
    .eq("status", "draft")

  if (error) throw new Error(error.message)

  // Notify all condominium members
  if (ballot) {
    await createNotificationForAllMembers({
      condominiumId: condominium.id,
      type: "ballot_open",
      title: "New ballot opened",
      body: `"${ballot.title}" is now open for voting.`,
      linkUrl: `/app/${condominiumSlug}/ballots/${ballotId}`,
    })

    // Fire-and-forget email via n8n
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    void triggerN8nWebhook("ballot_open", {
      condominium_id: condominium.id,
      ballot_title: ballot.title,
      close_at: ballot.close_at,
      ballot_url: `${siteUrl}/app/${condominiumSlug}/ballots/${ballotId}`,
    })
  }

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "ballot.opened",
    entityType: "ballot",
    entityId: ballotId,
    metadata: ballot ? { ballot_title: ballot.title } : null,
  })

  revalidatePath(`/app/${condominiumSlug}/ballots`)
  revalidatePath(`/app/${condominiumSlug}/ballots/${ballotId}`)
}

export async function closeBallot(
  condominiumSlug: string,
  ballotId: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("ballots")
    .update({ status: "closed" })
    .eq("id", ballotId)
    .eq("status", "open")

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "ballot.closed",
    entityType: "ballot",
    entityId: ballotId,
  })

  revalidatePath(`/app/${condominiumSlug}/ballots`)
  revalidatePath(`/app/${condominiumSlug}/ballots/${ballotId}`)
}

export async function publishResults(
  condominiumSlug: string,
  ballotId: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch ballot title before updating
  const { data: ballot } = await supabase
    .from("ballots")
    .select("title")
    .eq("id", ballotId)
    .single()

  const { error } = await supabase
    .from("ballots")
    .update({ status: "results_published" })
    .eq("id", ballotId)
    .eq("status", "closed")

  if (error) throw new Error(error.message)

  // Notify all condominium members
  if (ballot) {
    await createNotificationForAllMembers({
      condominiumId: condominium.id,
      type: "ballot_results",
      title: "Ballot results published",
      body: `Results for "${ballot.title}" are now available.`,
      linkUrl: `/app/${condominiumSlug}/ballots/${ballotId}/results`,
    })

    // Fire-and-forget email via n8n
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    void triggerN8nWebhook("ballot_results", {
      condominium_id: condominium.id,
      ballot_title: ballot.title,
      results_url: `${siteUrl}/app/${condominiumSlug}/ballots/${ballotId}/results`,
    })
  }

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "ballot.results_published",
    entityType: "ballot",
    entityId: ballotId,
    metadata: ballot ? { ballot_title: ballot.title } : null,
  })

  revalidatePath(`/app/${condominiumSlug}/ballots`)
  revalidatePath(`/app/${condominiumSlug}/ballots/${ballotId}`)
  revalidatePath(`/app/${condominiumSlug}/ballots/${ballotId}/results`)
}

export async function deleteBallot(
  condominiumSlug: string,
  ballotId: string
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("ballots")
    .delete()
    .eq("id", ballotId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/ballots`)
  redirect(`/app/${condominiumSlug}/ballots`)
}

// ─── Member action: cast vote ──────────────────────────────────────────────────

export async function castVote(
  condominiumSlug: string,
  ballotId: string,
  selectedOptions: string[]
): Promise<void> {
  const { user, condominium } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  // Verify ballot is open
  const { data: ballot } = await supabase
    .from("ballots")
    .select("status, question_type, options")
    .eq("id", ballotId)
    .single()

  if (!ballot) throw new Error("Ballot not found.")
  if (ballot.status !== "open") throw new Error("This ballot is not currently open for voting.")

  // Check has not already voted (unique constraint also enforces this)
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("ballot_id", ballotId)
    .eq("voter_id", user.id)
    .single()

  if (existingVote) throw new Error("You have already voted on this ballot.")

  const { error } = await supabase
    .from("votes")
    .insert({
      ballot_id: ballotId,
      voter_id: user.id,
      selected_options: selectedOptions as unknown as import("@/lib/types/database").Json,
    })

  if (error) {
    if (error.code === "23505") throw new Error("You have already voted on this ballot.")
    throw new Error(error.message)
  }

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "vote.cast",
    entityType: "ballot",
    entityId: ballotId,
    metadata: { voter_id: user.id, ballot_id: ballotId },
  })

  revalidatePath(`/app/${condominiumSlug}/ballots`)
  revalidatePath(`/app/${condominiumSlug}/ballots/${ballotId}`)
}

// ─── CSV export ────────────────────────────────────────────────────────────────

export async function exportResultsCsv(
  condominiumSlug: string,
  ballotId: string
): Promise<string> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { data: ballot } = await supabase
    .from("ballots")
    .select("title, question_type, options")
    .eq("id", ballotId)
    .eq("condominium_id", condominium.id)
    .single()

  if (!ballot) throw new Error("Ballot not found.")

  const { data: votes } = await supabase
    .from("votes")
    .select("voter_id, selected_options, voted_at")
    .eq("ballot_id", ballotId)

  if (!votes) return "voter_id,selected_options,voted_at\n"

  // Fetch voter profiles
  const voterIds = votes.map((v) => v.voter_id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", voterIds)

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

  const rows = votes.map((vote) => {
    const profile = profileMap.get(vote.voter_id)
    const name = profile?.full_name ?? vote.voter_id
    const email = profile?.email ?? ""
    const options = Array.isArray(vote.selected_options)
      ? (vote.selected_options as string[]).join("; ")
      : String(vote.selected_options)
    const votedAt = new Date(vote.voted_at).toISOString()
    return `"${name}","${email}","${options}","${votedAt}"`
  })

  const header = "name,email,selected_options,voted_at"
  return [header, ...rows].join("\n")
}
