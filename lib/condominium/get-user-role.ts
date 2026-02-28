import { createClient } from "@/lib/supabase/server"
import type { MemberRole } from "@/lib/types"

/**
 * Returns the current user's system_role ('admin' | 'user') for the given
 * condominium, or null if they are not a member.
 */
export async function getUserRole(
  userId: string,
  condominiumId: string
): Promise<MemberRole | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("condominium_members")
    .select("system_role")
    .eq("user_id", userId)
    .eq("condominium_id", condominiumId)
    .single()

  if (error || !data) return null

  return data.system_role as MemberRole
}
