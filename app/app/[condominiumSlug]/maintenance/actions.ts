"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { createNotification } from "@/lib/notifications/create-notification"
import { logAction } from "@/lib/audit/log-action"
import { triggerN8nWebhook } from "@/lib/n8n/trigger-webhook"

export type { MaintenanceCategory } from "@/lib/constants/domain-constants"

export type MaintenancePriority = "low" | "medium" | "high"
export type MaintenanceStatus =
  | "open"
  | "in_review"
  | "in_progress"
  | "resolved"
  | "closed"

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
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
  if (role !== "admin") redirect(`/app/${condominiumSlug}/maintenance`)
  return { user, condominium }
}

// ─── Helper: upload photo attachments ─────────────────────────────────────────

async function uploadPhotos(
  requestId: string,
  condominiumId: string,
  userId: string,
  files: File[]
): Promise<void> {
  const supabase = await createClient()

  for (const file of files) {
    if (file.size === 0) continue
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`File type "${file.type}" is not allowed. Only images are accepted.`)
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds the 20 MB limit.`)
    }

    const ext = file.name.split(".").pop()
    const storagePath = `${condominiumId}/${requestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("maintenance-attachments")
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) throw new Error(`Failed to upload "${file.name}": ${uploadError.message}`)

    const { error: dbError } = await supabase
      .from("maintenance_attachments")
      .insert({
        request_id: requestId,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        uploaded_by: userId,
      })

    if (dbError) {
      await supabase.storage.from("maintenance-attachments").remove([storagePath])
      throw new Error(dbError.message)
    }
  }
}

// ─── Submit request (any member) ──────────────────────────────────────────────

export async function submitMaintenanceRequest(
  condominiumSlug: string,
  formData: FormData
): Promise<{ id: string }> {
  const { user, condominium } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  const title = (formData.get("title") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() ?? null
  const category = (formData.get("category") as string) || null
  const location = (formData.get("location") as string)?.trim() || null
  const priority = (formData.get("priority") as MaintenancePriority) ?? "medium"

  if (!title) throw new Error("Title is required.")
  if (!["low", "medium", "high"].includes(priority)) throw new Error("Invalid priority.")

  const { data: request, error } = await supabase
    .from("maintenance_requests")
    .insert({
      condominium_id: condominium.id,
      submitter_id: user.id,
      title,
      description,
      category,
      location,
      priority,
      status: "open",
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Upload any attached photos
  const files = formData.getAll("photos") as File[]
  const validFiles = files.filter((f) => f.size > 0)
  if (validFiles.length > 0) {
    await uploadPhotos(request.id, condominium.id, user.id, validFiles)
  }

  revalidatePath(`/app/${condominiumSlug}/maintenance`)

  return request
}

// ─── Admin: update status ──────────────────────────────────────────────────────

export async function updateRequestStatus(
  condominiumSlug: string,
  requestId: string,
  newStatus: MaintenanceStatus,
  adminNotes?: string
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch submitter_id and title before updating
  const { data: request } = await supabase
    .from("maintenance_requests")
    .select("submitter_id, title, status")
    .eq("id", requestId)
    .single()

  const updateData: Record<string, string> = { status: newStatus }
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes
  }

  const { error } = await supabase
    .from("maintenance_requests")
    .update(updateData)
    .eq("id", requestId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  // Notify submitter
  if (request) {
    const statusLabels: Record<MaintenanceStatus, string> = {
      open: "Open",
      in_review: "In Review",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    }
    await createNotification({
      userId: request.submitter_id,
      condominiumId: condominium.id,
      type: "maintenance_status",
      title: "Maintenance request updated",
      body: `Your request "${request.title}" status changed to ${statusLabels[newStatus]}.`,
      linkUrl: `/app/${condominiumSlug}/maintenance/${requestId}`,
    })

    // Fire-and-forget email via n8n
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", request.submitter_id)
      .single()
    if (profile?.email) {
      await triggerN8nWebhook("maintenance_status", {
        user_email: profile.email,
        request_title: request.title,
        new_status: newStatus,
      })
    }
  }

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "maintenance.status_changed",
    entityType: "maintenance_request",
    entityId: requestId,
    metadata: {
      from: request?.status ?? null,
      to: newStatus,
      title: request?.title ?? null,
    },
  })

  revalidatePath(`/app/${condominiumSlug}/maintenance`)
  revalidatePath(`/app/${condominiumSlug}/maintenance/${requestId}`)
}

// ─── Admin: update notes only ──────────────────────────────────────────────────

export async function updateAdminNotes(
  condominiumSlug: string,
  requestId: string,
  notes: string
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("maintenance_requests")
    .update({ admin_notes: notes })
    .eq("id", requestId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/maintenance/${requestId}`)
}

// ─── Admin: update priority ────────────────────────────────────────────────────

export async function updatePriority(
  condominiumSlug: string,
  requestId: string,
  priority: MaintenancePriority
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("maintenance_requests")
    .update({ priority })
    .eq("id", requestId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/maintenance`)
  revalidatePath(`/app/${condominiumSlug}/maintenance/${requestId}`)
}

// ─── Generate signed photo URL ─────────────────────────────────────────────────

export async function generatePhotoUrl(
  condominiumSlug: string,
  attachmentId: string
): Promise<string> {
  const { user } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  const { data: attachment } = await supabase
    .from("maintenance_attachments")
    .select("storage_path, request_id, maintenance_requests(condominium_id, submitter_id)")
    .eq("id", attachmentId)
    .single()

  if (!attachment) throw new Error("Attachment not found or access denied.")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mr = attachment.maintenance_requests as any
  const role = await getUserRole(user.id, mr?.condominium_id)
  if (role !== "admin" && mr?.submitter_id !== user.id) {
    throw new Error("Access denied.")
  }

  const { data, error } = await supabase.storage
    .from("maintenance-attachments")
    .createSignedUrl(attachment.storage_path, 300)

  if (error || !data) throw new Error("Failed to generate photo URL.")

  return data.signedUrl
}
