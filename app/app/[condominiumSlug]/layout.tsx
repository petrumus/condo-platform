import { notFound } from "next/navigation"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { getUser } from "@/lib/auth/get-user"
import { CondominiumProvider } from "@/lib/context/condominium-context"
import { Navbar } from "@/components/layout/navbar"

interface CondominiumLayoutProps {
  children: React.ReactNode
  params: Promise<{ condominiumSlug: string }>
}

export default async function CondominiumLayout({
  children,
  params,
}: CondominiumLayoutProps) {
  const { condominiumSlug } = await params

  const [user, condominium] = await Promise.all([
    getUser(),
    getCondominium(condominiumSlug),
  ])

  if (!user || !condominium) {
    notFound()
  }

  const userRole = await getUserRole(user.id, condominium.id)

  if (!userRole) {
    notFound()
  }

  return (
    <CondominiumProvider condominium={condominium} userRole={userRole!}>
      <div className="flex min-h-screen flex-col">
        <Navbar user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </CondominiumProvider>
  )
}
