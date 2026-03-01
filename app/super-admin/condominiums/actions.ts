"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { triggerN8nWebhook } from "@/lib/n8n/trigger-webhook"

async function requireSuperAdmin() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) redirect("/")

  const isSuperAdmin =
    user.app_metadata?.role === "super-admin" ||
    user.app_metadata?.is_super_admin === true

  if (!isSuperAdmin) redirect("/")

  const supabase = await createServiceClient()
  return { user, supabase }
}

export async function createCondominium(formData: FormData) {
  const { supabase } = await requireSuperAdmin()

  const name = (formData.get("name") as string)?.trim()
  const slug = (formData.get("slug") as string)?.trim()
  const address = (formData.get("address") as string)?.trim() || null
  const description = (formData.get("description") as string)?.trim() || null

  if (!name || !slug) throw new Error("Name and slug are required")

  const { data, error } = await supabase
    .from("condominiums")
    .insert({ name, slug, address, description })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/super-admin/condominiums")
  redirect(`/super-admin/condominiums/${data.id}`)
}

export async function updateCondominium(id: string, formData: FormData) {
  const { supabase } = await requireSuperAdmin()

  const name = (formData.get("name") as string)?.trim()
  const address = (formData.get("address") as string)?.trim() || null
  const description = (formData.get("description") as string)?.trim() || null

  if (!name) throw new Error("Name is required")

  const { error } = await supabase
    .from("condominiums")
    .update({ name, address, description })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/super-admin/condominiums")
  revalidatePath(`/super-admin/condominiums/${id}`)
}

export async function suspendCondominium(id: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from("condominiums")
    .update({ status: "suspended" })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/super-admin/condominiums")
  revalidatePath(`/super-admin/condominiums/${id}`)
}

export async function reactivateCondominium(id: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from("condominiums")
    .update({ status: "active" })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/super-admin/condominiums")
  revalidatePath(`/super-admin/condominiums/${id}`)
}

export async function deleteCondominium(id: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from("condominiums")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/super-admin/condominiums")
  redirect("/super-admin/condominiums")
}

export async function updateMemberRole(
  memberId: string,
  condominiumId: string,
  role: "admin" | "user"
) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from("condominium_members")
    .update({ system_role: role })
    .eq("id", memberId)

  if (error) throw new Error(error.message)

  revalidatePath(`/super-admin/condominiums/${condominiumId}`)
}

export async function removeMember(memberId: string, condominiumId: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from("condominium_members")
    .delete()
    .eq("id", memberId)

  if (error) throw new Error(error.message)

  revalidatePath(`/super-admin/condominiums/${condominiumId}`)
}

export async function inviteAdmin(condominiumId: string, email: string) {
  const { user, supabase } = await requireSuperAdmin()

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      condominium_id: condominiumId,
      email: email.trim().toLowerCase(),
      role: "admin",
      created_by: user.id,
    })
    .select("token")
    .single()

  if (error) throw new Error(error.message)

  // Fire-and-forget invitation email via n8n
  if (invitation) {
    const { data: condo } = await supabase
      .from("condominiums")
      .select("name")
      .eq("id", condominiumId)
      .single()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    await triggerN8nWebhook("invitation", {
      email: email.trim().toLowerCase(),
      invite_url: `${siteUrl}/invite/${invitation.token}`,
      condominium_name: condo?.name ?? "",
    })
  }

  revalidatePath(`/super-admin/condominiums/${condominiumId}`)
}
