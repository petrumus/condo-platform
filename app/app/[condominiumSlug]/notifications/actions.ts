"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { redirect } from "next/navigation"

async function requireMember(condominiumSlug: string) {
  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  return { user, condominium }
}

export async function markNotificationRead(
  condominiumSlug: string,
  notificationId: string
): Promise<void> {
  const { user } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  revalidatePath(`/app/${condominiumSlug}/notifications`)
}

export async function markAllNotificationsRead(condominiumSlug: string): Promise<void> {
  const { user, condominium } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("condominium_id", condominium.id)
    .eq("read", false)

  revalidatePath(`/app/${condominiumSlug}/notifications`)
}
