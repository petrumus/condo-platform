import { redirect } from "next/navigation"
import Link from "next/link"
import { getUser } from "@/lib/auth/get-user"
import { getUserMemberships } from "@/lib/auth/get-membership"
import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default async function CondominiumPickerPage() {
  const user = await getUser()
  if (!user) redirect("/")

  const memberships = await getUserMemberships(user.id)

  if (memberships.length === 0) {
    redirect("/pending")
  }

  if (memberships.length === 1) {
    const slug = (memberships[0] as { condominiums: { slug: string } | null })
      .condominiums?.slug
    if (slug) redirect(`/app/${slug}/dashboard`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">
          Choose a workspace
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          You are a member of multiple condominiums. Select one to continue.
        </p>
        <ul className="space-y-2">
          {memberships.map((membership) => {
            const condo = (
              membership as {
                condominiums: { id: string; name: string; slug: string } | null
              }
            ).condominiums
            if (!condo) return null

            return (
              <li key={condo.id}>
                <Link href={`/app/${condo.slug}/dashboard`}>
                  <Card className="transition-colors hover:border-primary/50 hover:bg-accent/30 cursor-pointer">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{condo.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
