import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CalendarDays, Pin, Paperclip } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PinButton } from "@/components/announcements/pin-button"
import { DeleteAnnouncementButton } from "@/components/announcements/delete-announcement-button"
import { AttachmentDownloadButton } from "@/components/announcements/attachment-download-button"
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

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  const { data: announcementData } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  const announcement = announcementData as Tables<"announcements"> | null
  if (!announcement) notFound()

  // Non-admins cannot see unpublished announcements
  if (!isAdmin && !announcement.published_at) notFound()

  const { data: attachments } = await supabase
    .from("announcement_attachments")
    .select("id, file_name, file_size_bytes, created_at")
    .eq("announcement_id", id)
    .order("created_at", { ascending: true })

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`${base}/announcements`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Announcements
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 flex-wrap">
          {announcement.pinned && (
            <Pin className="h-5 w-5 shrink-0 text-muted-foreground mt-1" />
          )}
          <h1 className="text-2xl font-bold flex-1">{announcement.title}</h1>
        </div>
        {announcement.published_at && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Published {formatDate(announcement.published_at)}
          </div>
        )}
      </div>

      {/* Body */}
      <Card>
        <CardContent className="pt-6">
          {announcement.body ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.body}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No content.</p>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2">
                <AttachmentDownloadButton
                  condominiumSlug={condominiumSlug}
                  attachmentId={att.id}
                  fileName={att.file_name}
                />
                {att.file_size_bytes && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(att.file_size_bytes / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button asChild variant="outline" size="sm">
                <Link href={`${base}/announcements/${id}/edit`}>Edit</Link>
              </Button>
              <PinButton
                condominiumSlug={condominiumSlug}
                announcementId={id}
                pinned={announcement.pinned}
              />
              <Separator orientation="vertical" className="h-6" />
              <DeleteAnnouncementButton
                condominiumSlug={condominiumSlug}
                announcementId={id}
                announcementTitle={announcement.title}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
