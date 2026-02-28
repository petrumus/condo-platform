import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function SettingsIndexPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)

  if (role === "admin") {
    redirect(`/app/${condominiumSlug}/settings/general`)
  } else {
    redirect(`/app/${condominiumSlug}/settings/profile`)
  }
}
