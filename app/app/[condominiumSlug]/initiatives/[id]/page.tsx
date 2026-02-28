import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Tag, CalendarDays, User, FileText, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { InitiativeStatusBadge } from "@/components/initiatives/initiative-status-badge"
import { AdminInitiativeActions } from "@/components/initiatives/admin-initiative-actions"
import type { Tables } from "@/lib/types/database"

interface PageProps {
  params: Promise<{ condominiumSlug: string; id: string }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default async function InitiativeDetailPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  const { data: initiativeData } = await supabase
    .from("initiatives")
    .select("*")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  const initiative = initiativeData as Tables<"initiatives"> | null
  if (!initiative) notFound()

  // Non-admins can only see: their own initiatives, or approved/converted ones
  if (!isAdmin && initiative.submitter_id !== user.id) {
    if (!["approved", "converted"].includes(initiative.status)) {
      notFound()
    }
  }

  // Fetch submitter profile
  const { data: submitterProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", initiative.submitter_id)
    .single()

  // Fetch attachments
  const { data: attachments } = await supabase
    .from("initiative_attachments")
    .select("id, file_name, storage_path, created_at")
    .eq("initiative_id", id)
    .order("created_at", { ascending: true })

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`${base}/initiatives`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Initiatives
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">{initiative.title}</h1>
          <InitiativeStatusBadge status={initiative.status} />
        </div>
        {initiative.category && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            {initiative.category}
          </div>
        )}
      </div>

      {/* Details card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {initiative.description ? (
            <p className="text-muted-foreground whitespace-pre-wrap">{initiative.description}</p>
          ) : (
            <p className="text-muted-foreground italic">No description provided.</p>
          )}

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted by</p>
                <p className="font-medium">{submitterProfile?.full_name ?? "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted on</p>
                <p className="font-medium">{formatDate(initiative.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection reason */}
      {initiative.status === "rejected" && initiative.admin_notes && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Rejection Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{initiative.admin_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>{attachment.file_name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Admin action controls */}
      {isAdmin && (
        <AdminInitiativeActions
          condominiumSlug={condominiumSlug}
          initiativeId={id}
          currentStatus={initiative.status}
        />
      )}
    </div>
  )
}
