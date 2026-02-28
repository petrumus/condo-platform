import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "./profile-form"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your display name and profile photo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>
            Your display name and photo are visible to other members of this condominium.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            profile={{
              full_name: profile?.full_name ?? null,
              avatar_url: profile?.avatar_url ?? null,
            }}
            userEmail={user.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  )
}
