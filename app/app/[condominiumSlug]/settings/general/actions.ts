"use server"

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { logAction } from "@/lib/audit/log-action"

async function requireAdmin(condominiumSlug: string) {
  const user = await getUser()
  if (!user) throw new Error("Not authenticated")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) throw new Error("Condominium not found")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") throw new Error("Admin access required")

  return { user, condominium }
}

export async function updateCondominiumInfo(
  condominiumSlug: string,
  data: { name: string; address: string; description: string }
) {
  const { user, condominium } = await requireAdmin(condominiumSlug)

  if (!data.name.trim()) throw new Error("Name is required")

  const supabase = await createClient()
  const { error } = await supabase
    .from("condominiums")
    .update({
      name: data.name.trim(),
      address: data.address.trim() || null,
      description: data.description.trim() || null,
    })
    .eq("id", condominium.id)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "condominium.updated",
    entityType: "condominium",
    entityId: condominium.id,
    metadata: { name: data.name.trim(), address: data.address.trim() || null },
  })

  revalidatePath(`/app/${condominiumSlug}/settings/general`)
  revalidatePath(`/app/${condominiumSlug}`)
}

export async function updateCondominiumLogo(
  condominiumSlug: string,
  formData: FormData
) {
  const { user, condominium } = await requireAdmin(condominiumSlug)

  const file = formData.get("logo") as File | null
  if (!file || file.size === 0) throw new Error("No file provided")
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed")
  if (file.size > 2 * 1024 * 1024) throw new Error("File must be under 2 MB")

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `condominiums/${condominium.id}/logo.${ext}`

  const serviceSupabase = await createServiceClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await serviceSupabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrlData } = serviceSupabase.storage
    .from("avatars")
    .getPublicUrl(path)

  const supabase = await createClient()
  const { error } = await supabase
    .from("condominiums")
    .update({ logo_url: publicUrlData.publicUrl })
    .eq("id", condominium.id)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "condominium.logo_updated",
    entityType: "condominium",
    entityId: condominium.id,
  })

  revalidatePath(`/app/${condominiumSlug}/settings/general`)
  revalidatePath(`/app/${condominiumSlug}`)
}
