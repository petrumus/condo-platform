import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { SettingsNav } from "@/components/settings/settings-nav"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ condominiumSlug: string }>
}

export default async function SettingsLayout({ children, params }: LayoutProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SettingsNav
        condominiumSlug={condominiumSlug}
        isAdmin={role === "admin"}
      />
      <main className="flex-1 p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
