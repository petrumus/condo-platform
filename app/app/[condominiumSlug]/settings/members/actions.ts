"use server"

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import type { MemberRole } from "@/lib/types"
import { logAction } from "@/lib/audit/log-action"

// ─── Guard helper ─────────────────────────────────────────────────────────────

async function requireAdmin(condominiumSlug: string) {
  const user = await getUser()
  if (!user) throw new Error("Not authenticated")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) throw new Error("Condominium not found")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") throw new Error("Admin access required")

  return { user, condominium }
}

// ─── Member actions ───────────────────────────────────────────────────────────

export async function updateMemberRole(
  condominiumSlug: string,
  memberId: string,
  newRole: MemberRole
) {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("condominium_members")
    .update({ system_role: newRole })
    .eq("id", memberId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "member.role_changed",
    entityType: "condominium_member",
    entityId: memberId,
    metadata: { new_role: newRole },
  })

  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}

export async function updateMemberTitle(
  condominiumSlug: string,
  memberId: string,
  titleId: string | null
) {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("condominium_members")
    .update({ functional_title_id: titleId })
    .eq("id", memberId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "member.title_assigned",
    entityType: "condominium_member",
    entityId: memberId,
    metadata: { title_id: titleId },
  })

  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}

export async function removeMember(condominiumSlug: string, memberId: string) {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Prevent self-removal
  const { data: target } = await supabase
    .from("condominium_members")
    .select("user_id")
    .eq("id", memberId)
    .eq("condominium_id", condominium.id)
    .single()

  if (target?.user_id === user.id) {
    throw new Error("You cannot remove yourself from the condominium")
  }

  const { error } = await supabase
    .from("condominium_members")
    .delete()
    .eq("id", memberId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "member.removed",
    entityType: "condominium_member",
    entityId: memberId,
    metadata: { removed_user_id: target?.user_id ?? null },
  })

  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}

// ─── Invite actions ───────────────────────────────────────────────────────────

export async function inviteMember(
  condominiumSlug: string,
  email: string,
  role: MemberRole
) {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Check for an existing pending invitation to the same email
  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("condominium_id", condominium.id)
    .eq("email", email.toLowerCase())
    .is("accepted_at", null)
    .single()

  if (existing) {
    throw new Error("An invitation for this email is already pending")
  }

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      condominium_id: condominium.id,
      email: email.toLowerCase(),
      role,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "member.invited",
    entityType: "invitation",
    entityId: invitation?.id ?? null,
    metadata: { email: email.toLowerCase(), role },
  })

  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}

export async function revokeInvitation(
  condominiumSlug: string,
  invitationId: string
) {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "member.invitation_revoked",
    entityType: "invitation",
    entityId: invitationId,
  })

  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}
