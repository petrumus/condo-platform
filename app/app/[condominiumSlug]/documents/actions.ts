"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"

export type Visibility = "public" | "members" | "admin-only"

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
  if (role !== "admin") redirect(`/app/${condominiumSlug}/documents`)
  return { user, condominium }
}

// ─── Folder actions ───────────────────────────────────────────────────────────

export async function createFolder(
  condominiumSlug: string,
  name: string,
  visibility: Visibility,
  parentFolderId: string | null = null
): Promise<{ id: string }> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("document_folders")
    .insert({
      condominium_id: condominium.id,
      parent_folder_id: parentFolderId,
      name: name.trim(),
      default_visibility: visibility,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/documents`)
  if (parentFolderId) {
    revalidatePath(`/app/${condominiumSlug}/documents/${parentFolderId}`)
  }
  return data
}

export async function updateFolder(
  condominiumSlug: string,
  folderId: string,
  name: string,
  visibility: Visibility
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from("document_folders")
    .update({ name: name.trim(), default_visibility: visibility })
    .eq("id", folderId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/documents`)
  revalidatePath(`/app/${condominiumSlug}/documents/${folderId}`)
}

export async function deleteFolder(
  condominiumSlug: string,
  folderId: string
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Check folder is empty (no subfolders and no documents)
  const [{ count: subfolderCount }, { count: docCount }] = await Promise.all([
    supabase
      .from("document_folders")
      .select("id", { count: "exact", head: true })
      .eq("parent_folder_id", folderId),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("folder_id", folderId),
  ])

  if ((subfolderCount ?? 0) > 0 || (docCount ?? 0) > 0) {
    throw new Error("Cannot delete a folder that contains items. Remove all contents first.")
  }

  const { error } = await supabase
    .from("document_folders")
    .delete()
    .eq("id", folderId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/documents`)
}

// ─── Document actions ─────────────────────────────────────────────────────────

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

export async function uploadDocument(
  condominiumSlug: string,
  folderId: string | null,
  formData: FormData
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const file = formData.get("file") as File | null
  const visibilityOverride = (formData.get("visibility_override") as Visibility) || null
  const customName = (formData.get("name") as string)?.trim() || null

  if (!file || file.size === 0) throw new Error("No file selected.")
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed.`)
  }
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("File size exceeds the 50 MB limit.")
  }

  const ext = file.name.split(".").pop()
  const storagePath = `${condominium.id}/${folderId ?? "root"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const displayName = customName || file.name

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { error: dbError } = await supabase.from("documents").insert({
    condominium_id: condominium.id,
    folder_id: folderId,
    name: displayName,
    storage_path: storagePath,
    file_size_bytes: file.size,
    mime_type: file.type,
    visibility_override: visibilityOverride || null,
    uploaded_by: user.id,
  })

  if (dbError) {
    // Try to clean up the uploaded file
    await supabase.storage.from("documents").remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath(`/app/${condominiumSlug}/documents`)
  if (folderId) {
    revalidatePath(`/app/${condominiumSlug}/documents/${folderId}`)
  }
}

export async function updateDocument(
  condominiumSlug: string,
  documentId: string,
  name: string,
  visibilityOverride: Visibility | null
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from("documents")
    .select("folder_id")
    .eq("id", documentId)
    .single()

  const { error } = await supabase
    .from("documents")
    .update({ name: name.trim(), visibility_override: visibilityOverride })
    .eq("id", documentId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/documents`)
  if (doc?.folder_id) {
    revalidatePath(`/app/${condominiumSlug}/documents/${doc.folder_id}`)
  }
}

export async function deleteDocument(
  condominiumSlug: string,
  documentId: string
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch the storage path first
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, folder_id")
    .eq("id", documentId)
    .single()

  if (!doc) throw new Error("Document not found.")

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([doc.storage_path])

  if (storageError) throw new Error(storageError.message)

  // Delete from DB
  const { error } = await supabase.from("documents").delete().eq("id", documentId)
  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/documents`)
  if (doc.folder_id) {
    revalidatePath(`/app/${condominiumSlug}/documents/${doc.folder_id}`)
  }
}

// ─── Download URL ─────────────────────────────────────────────────────────────

export async function generateDownloadUrl(
  condominiumSlug: string,
  documentId: string
): Promise<string> {
  const { condominium } = await requireMember(condominiumSlug)
  const supabase = await createClient()

  // Verify document belongs to this condominium
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, visibility_override, folder_id")
    .eq("id", documentId)
    .eq("condominium_id", condominium.id)
    .single()

  if (!doc) throw new Error("Document not found or access denied.")

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60) // 60 second TTL

  if (error || !data) throw new Error("Failed to generate download URL.")

  return data.signedUrl
}
