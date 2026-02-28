import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CheckCircle, Eye, Tag, User, CalendarDays } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { InitiativeStatusBadge } from "@/components/initiatives/initiative-status-badge"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function InitiativeReviewPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/initiatives`)

  const supabase = await createClient()

  const { data: initiatives } = await supabase
    .from("initiatives")
    .select("id, title, category, status, submitter_id, created_at, description")
    .eq("condominium_id", condominium.id)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true })

  // Fetch submitter names
  let submitterNames: Record<string, string> = {}
  if (initiatives && initiatives.length > 0) {
    const submitterIds = [...new Set(initiatives.map((i) => i.submitter_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", submitterIds)

    if (profiles) {
      submitterNames = Object.fromEntries(profiles.map((p) => [p.id, p.full_name ?? ""]))
    }
  }

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`${base}/initiatives`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Initiatives
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {initiatives?.length ?? 0} initiative{initiatives?.length !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {!initiatives || initiatives.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-sm">No initiatives are waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initiatives.map((initiative) => (
            <Card key={initiative.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{initiative.title}</h3>
                      <InitiativeStatusBadge status={initiative.status} />
                    </div>
                    {initiative.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {initiative.description}
                      </p>
                    )}
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link href={`${base}/initiatives/${initiative.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Review
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {initiative.category && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {initiative.category}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {submitterNames[initiative.submitter_id] ?? "Unknown"}
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(initiative.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
