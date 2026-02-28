import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/types/database"

export type CondominiumBasic = Pick<
  Tables<"condominiums">,
  "id" | "name" | "slug" | "logo_url" | "address" | "description"
>

/**
 * Fetches a condominium by slug server-side.
 * Returns null if the condominium does not exist or the user is not a member
 * (RLS enforces membership automatically).
 */
export async function getCondominium(
  slug: string
): Promise<CondominiumBasic | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("condominiums")
    .select("id, name, slug, logo_url, address, description")
    .eq("slug", slug)
    .single()

  if (error || !data) return null

  return data as CondominiumBasic
}
