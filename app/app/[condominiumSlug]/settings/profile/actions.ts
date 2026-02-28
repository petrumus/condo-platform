"use server"

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"

export async function updateProfile(data: { full_name: string }) {
  const user = await getUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: data.full_name.trim() || null })
    .eq("id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/")
}

export async function uploadAvatar(formData: FormData) {
  const user = await getUser()
  if (!user) throw new Error("Not authenticated")

  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) throw new Error("No file provided")
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed")
  if (file.size > 2 * 1024 * 1024) throw new Error("File must be under 2 MB")

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `profiles/${user.id}/avatar.${ext}`

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
    .from("profiles")
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq("id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/")
}
