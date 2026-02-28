import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Paperclip } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnnouncementForm } from "@/components/announcements/announcement-form"
import { DeleteAttachmentButton } from "@/components/announcements/delete-attachment-button"

interface PageProps {
  params: Promise<{ condominiumSlug: string; id: string }>
}

export default async function EditAnnouncementPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")
  if (role !== "admin") redirect(`/app/${condominiumSlug}/announcements/${id}`)

  const supabase = await createClient()

  const { data: announcement } = await supabase
    .from("announcements")
    .select("id, title, body, pinned")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  if (!announcement) notFound()

  const { data: attachments } = await supabase
    .from("announcement_attachments")
    .select("id, file_name, file_size_bytes")
    .eq("announcement_id", id)
    .order("created_at", { ascending: true })

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`${base}/announcements/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Announcement
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Edit Announcement</h1>
        <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcement Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm condominiumSlug={condominiumSlug} existing={announcement} />
        </CardContent>
      </Card>

      {/* Existing attachments management */}
      {attachments && attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Current Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Remove individual files here, or add new ones using the form above.
            </p>
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{att.file_name}</span>
                  {att.file_size_bytes && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({(att.file_size_bytes / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>
                <DeleteAttachmentButton
                  condominiumSlug={condominiumSlug}
                  attachmentId={att.id}
                  fileName={att.file_name}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
