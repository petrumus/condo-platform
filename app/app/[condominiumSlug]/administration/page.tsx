import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Settings } from "lucide-react"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { getGovernanceMembers } from "@/lib/queries/administration"
import { GovernanceGrid } from "@/components/administration/governance-grid"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function AdministrationPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"

  const members = await getGovernanceMembers(condominium.id)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Governance team of {condominium.name}
          </p>
        </div>
        {isAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/${condominiumSlug}/settings/members`}>
              <Settings className="h-4 w-4 mr-1.5" />
              Manage Team
            </Link>
          </Button>
        )}
      </div>

      {/* Governance grid or empty state */}
      {members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No governance team members assigned yet.</p>
          {isAdmin && (
            <p className="text-sm mt-1">
              <Link
                href={`/app/${condominiumSlug}/settings/members`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Assign functional titles to members
              </Link>{" "}
              to populate this page.
            </p>
          )}
        </div>
      ) : (
        <GovernanceGrid members={members} />
      )}
    </div>
  )
}
