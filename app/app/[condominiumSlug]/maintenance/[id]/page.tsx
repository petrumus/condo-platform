import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CalendarDays, MapPin, Tag, User, FileImage } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge"
import { MaintenancePriorityBadge } from "@/components/maintenance/maintenance-priority-badge"
import { AdminMaintenanceActions } from "@/components/maintenance/admin-maintenance-actions"
import { PhotoGallery } from "@/components/maintenance/photo-gallery"
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

export default async function MaintenanceDetailPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  const { data: requestData } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  const request = requestData as Tables<"maintenance_requests"> | null
  if (!request) notFound()

  // Non-admins can only see their own requests
  if (!isAdmin && request.submitter_id !== user.id) {
    notFound()
  }

  // Fetch submitter profile
  const { data: submitterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", request.submitter_id)
    .single()

  // Fetch photo attachments
  const { data: attachments } = await supabase
    .from("maintenance_attachments")
    .select("id, file_name, storage_path")
    .eq("request_id", id)
    .order("created_at", { ascending: true })

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`${base}/maintenance`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Maintenance
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <MaintenancePriorityBadge priority={request.priority} />
            <MaintenanceStatusBadge status={request.status} />
          </div>
        </div>
      </div>

      {/* Details card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {request.description ? (
            <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
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
                <p className="font-medium">{formatDate(request.created_at)}</p>
              </div>
            </div>
            {request.category && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{request.category}</p>
                </div>
              </div>
            )}
            {request.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{request.location}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin notes / resolution */}
      {request.admin_notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {request.admin_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Photo gallery */}
      {attachments && attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoGallery
              condominiumSlug={condominiumSlug}
              attachments={attachments}
            />
          </CardContent>
        </Card>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <AdminMaintenanceActions
          condominiumSlug={condominiumSlug}
          requestId={id}
          currentStatus={request.status}
          currentPriority={request.priority}
          currentAdminNotes={request.admin_notes}
        />
      )}
    </div>
  )
}
