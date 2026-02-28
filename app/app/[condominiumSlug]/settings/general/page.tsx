import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GeneralSettingsForm } from "./general-settings-form"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function GeneralSettingsPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/dashboard`)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">General Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your condominium&apos;s name, contact details, and logo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condominium Information</CardTitle>
          <CardDescription>
            This information is displayed across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeneralSettingsForm
            condominiumSlug={condominiumSlug}
            condominium={condominium}
          />
        </CardContent>
      </Card>
    </div>
  )
}
