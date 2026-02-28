"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"

// Built-in title names that cannot be deleted
const BUILT_IN_TITLES = ["Administrator", "Councilor", "Auditor", "Accountant"]

async function requireAdmin(condominiumSlug: string) {
  const user = await getUser()
  if (!user) throw new Error("Not authenticated")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) throw new Error("Condominium not found")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") throw new Error("Admin access required")

  return { user, condominium }
}

export async function createTitle(
  condominiumSlug: string,
  name: string,
  sortOrder: number
) {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase.from("functional_titles").insert({
    condominium_id: condominium.id,
    name: name.trim(),
    sort_order: sortOrder,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/titles`)
  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}

export async function updateTitle(
  condominiumSlug: string,
  id: string,
  name: string,
  sortOrder: number
) {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch the title to check if it's built-in
  const { data: title } = await supabase
    .from("functional_titles")
    .select("name")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  if (!title) throw new Error("Title not found")

  const isBuiltIn = BUILT_IN_TITLES.includes(title.name)
  const updates = isBuiltIn
    ? { sort_order: sortOrder }          // built-in: only allow reordering
    : { name: name.trim(), sort_order: sortOrder }

  const { error } = await supabase
    .from("functional_titles")
    .update(updates)
    .eq("id", id)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/titles`)
  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}

export async function deleteTitle(condominiumSlug: string, id: string) {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { data: title } = await supabase
    .from("functional_titles")
    .select("name")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  if (!title) throw new Error("Title not found")

  if (BUILT_IN_TITLES.includes(title.name)) {
    throw new Error("Built-in titles cannot be deleted")
  }

  const { error } = await supabase
    .from("functional_titles")
    .delete()
    .eq("id", id)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/titles`)
  revalidatePath(`/app/${condominiumSlug}/settings/members`)
}
