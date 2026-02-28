import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/types/database"

type Membership = Tables<"condominium_members"> & {
  condominiums: Pick<Tables<"condominiums">, "id" | "name" | "slug" | "logo_url">
  functional_titles: Pick<Tables<"functional_titles">, "id" | "name"> | null
}

/**
 * Returns the user's membership record for a given condominium slug,
 * including the condominium data and their functional title.
 * Returns null if the user is not a member.
 */
export async function getMembership(
  userId: string,
  condominiumSlug: string
): Promise<Membership | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("condominium_members")
    .select(
      `
      *,
      condominiums!inner ( id, name, slug, logo_url ),
      functional_titles ( id, name )
    `
    )
    .eq("user_id", userId)
    .eq("condominiums.slug", condominiumSlug)
    .single()

  if (error || !data) return null

  return data as Membership
}

/**
 * Returns all condominium memberships for a user.
 * Used by middleware to determine where to redirect after login.
 */
export async function getUserMemberships(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("condominium_members")
    .select("*, condominiums ( id, name, slug )")
    .eq("user_id", userId)

  if (error || !data) return []

  return data
}
