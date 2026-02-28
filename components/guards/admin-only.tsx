import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"

interface AdminOnlyProps {
  condominiumSlug: string
  children: React.ReactNode
}

/**
 * Server component wrapper — renders children only if the current user
 * is an admin of the given condominium. Redirects to dashboard otherwise.
 */
export async function AdminOnly({ condominiumSlug, children }: AdminOnlyProps) {
  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") {
    redirect(`/app/${condominiumSlug}/dashboard`)
  }

  return <>{children}</>
}
