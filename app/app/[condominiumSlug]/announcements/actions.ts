"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { createNotificationForAllMembers } from "@/lib/notifications/create-notification"
import { logAction } from "@/lib/audit/log-action"
import { triggerN8nWebhook } from "@/lib/n8n/trigger-webhook"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]

// ─── Auth helpers ──────────────────────────────────────────────────────────────

async function requireMember(condominiumSlug: string) {
  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  return { user, condominium, role }
}

async function requireAdmin(condominiumSlug: string) {
  const { user, condominium, role } = await requireMember(condominiumSlug)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/announcements`)
  return { user, condominium }
}

// ─── Helper: upload attachment files ──────────────────────────────────────────

async function uploadAttachments(
  announcementId: string,
  condominiumId: string,
  userId: string,
  files: File[]
): Promise<void> {
  const supabase = await createClient()

  for (const file of files) {
    if (file.size === 0) continue
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`File type "${file.type}" is not allowed.`)
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds the 50 MB limit.`)
    }

    const ext = file.name.split(".").pop()
    const storagePath = `${condominiumId}/${announcementId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("announcement-attachments")
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) throw new Error(`Failed to upload "${file.name}": ${uploadError.message}`)

    const { error: dbError } = await supabase
      .from("announcement_attachments")
      .insert({
        announcement_id: announcementId,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        uploaded_by: userId,
      })

    if (dbError) {
      // Clean up the uploaded file on DB error
      await supabase.storage.from("announcement-attachments").remove([storagePath])
      throw new Error(dbError.message)
    }
  }
}

// ─── Admin actions ────────────────────────────────────────────────────────────

export async function publishAnnouncement(
  condominiumSlug: string,
  formData: FormData
): Promise<{ id: string }> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const title = (formData.get("title") as string)?.trim()
  const body = (formData.get("body") as string)?.trim() ?? ""
  const pinned = formData.get("pinned") === "true"

  if (!title) throw new Error("Title is required.")

  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      condominium_id: condominium.id,
      title,
      body,
      pinned,
      published_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Upload any attached files
  const files = formData.getAll("files") as File[]
  const validFiles = files.filter((f) => f.size > 0)
  if (validFiles.length > 0) {
    await uploadAttachments(announcement.id, condominium.id, user.id, validFiles)
  }

  // Notify all condominium members about the new announcement
  await createNotificationForAllMembers({
    condominiumId: condominium.id,
    type: "announcement",
    title: "New announcement",
    body: title,
    linkUrl: `/app/${condominiumSlug}/announcements/${announcement.id}`,
  })

  // Fire-and-forget email via n8n
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  void triggerN8nWebhook("announcement", {
    condominium_id: condominium.id,
    announcement_title: title,
    announcement_url: `${siteUrl}/app/${condominiumSlug}/announcements/${announcement.id}`,
  })

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "announcement.published",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { title, pinned },
  })

  revalidatePath(`/app/${condominiumSlug}/announcements`)
  revalidatePath(`/app/${condominiumSlug}/dashboard`)

  return announcement
}

export async function updateAnnouncement(
  condominiumSlug: string,
  announcementId: string,
  formData: FormData
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const title = (formData.get("title") as string)?.trim()
  const body = (formData.get("body") as string)?.trim() ?? ""
  const pinned = formData.get("pinned") === "true"

  if (!title) throw new Error("Title is required.")

  const { error } = await supabase
    .from("announcements")
    .update({ title, body, pinned })
    .eq("id", announcementId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  // Upload any newly attached files
  const files = formData.getAll("files") as File[]
  const validFiles = files.filter((f) => f.size > 0)
  if (validFiles.length > 0) {
    await uploadAttachments(announcementId, condominium.id, user.id, validFiles)
  }

  revalidatePath(`/app/${condominiumSlug}/announcements`)
  revalidatePath(`/app/${condominiumSlug}/announcements/${announcementId}`)
}

export async function deleteAnnouncement(
  condominiumSlug: string,
  announcementId: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch all attachment storage paths before deleting
  const { data: attachments } = await supabase
    .from("announcement_attachments")
    .select("storage_path")
    .eq("announcement_id", announcementId)

  // Delete from Storage
  if (attachments && attachments.length > 0) {
    const paths = attachments.map((a) => a.storage_path)
    await supabase.storage.from("announcement-attachments").remove(paths)
  }

  // Delete announcement (cascades to attachment_attachments rows)
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", announcementId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/announcements`)
  revalidatePath(`/app/${condominiumSlug}/dashboard`)
  redirect(`/app/${condominiumSlug}/announcements`)
}

export async function togglePin(
  condominiumSlug: string,
  announcementId: string,
  currentPinned: boolean
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("announcements")
    .update({ pinned: !currentPinned })
    .eq("id", announcementId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/announcements`)
  revalidatePath(`/app/${condominiumSlug}/announcements/${announcementId}`)
}

export async function deleteAttachment(
  condominiumSlug: string,
  attachmentId: string
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { data: attachment } = await supabase
    .from("announcement_attachments")
    .select("storage_path, announcement_id, announcements(condominium_id)")
    .eq("id", attachmentId)
    .single()

  if (!attachment) throw new Error("Attachment not found.")

  // Verify it belongs to this condominium
  const attachmentCondoId =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (attachment.announcements as any)?.condominium_id
  if (attachmentCondoId !== condominium.id) throw new Error("Access denied.")

  await supabase.storage.from("announcement-attachments").remove([attachment.storage_path])
  const { error } = await supabase
    .from("announcement_attachments")
    .delete()
    .eq("id", attachmentId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/announcements/${attachment.announcement_id}`)
  revalidatePath(`/app/${condominiumSlug}/announcements/${attachment.announcement_id}/edit`)
}

// ─── Attachment download ──────────────────────────────────────────────────────

export async function generateAttachmentDownloadUrl(
  condominiumSlug: string,
  attachmentId: string
): Promise<string> {
  const { condominium } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  const { data: attachment } = await supabase
    .from("announcement_attachments")
    .select("storage_path, announcements(condominium_id)")
    .eq("id", attachmentId)
    .single()

  if (!attachment) throw new Error("Attachment not found or access denied.")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachmentCondoId = (attachment.announcements as any)?.condominium_id
  if (attachmentCondoId !== condominium.id) throw new Error("Access denied.")

  const { data, error } = await supabase.storage
    .from("announcement-attachments")
    .createSignedUrl(attachment.storage_path, 60)

  if (error || !data) throw new Error("Failed to generate download URL.")

  return data.signedUrl
}
