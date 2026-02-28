import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

interface SuperAdminOnlyProps {
  children: React.ReactNode
}

/**
 * Server component wrapper — renders children only if the current user
 * has the super-admin platform role. Redirects to root otherwise.
 */
export async function SuperAdminOnly({ children }: SuperAdminOnlyProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/")

  const isSuperAdmin = user.user_metadata?.system_role === "super-admin"
  if (!isSuperAdmin) redirect("/")

  return <>{children}</>
}
