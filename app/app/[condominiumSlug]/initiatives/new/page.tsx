import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { InitiativeForm } from "@/components/initiatives/initiative-form"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function NewInitiativePage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`${base}/initiatives`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Initiatives
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Submit an Initiative</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share your idea or request with the condominium administrators.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Initiative Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InitiativeForm condominiumSlug={condominiumSlug} />
        </CardContent>
      </Card>
    </div>
  )
}
