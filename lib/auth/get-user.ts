import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

/**
 * Returns the authenticated user server-side, or null if not logged in.
 * Uses getUser() which validates the JWT with Supabase — safe for auth checks.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
