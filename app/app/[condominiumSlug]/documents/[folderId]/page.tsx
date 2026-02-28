import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronRight, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { NewFolderDialog } from "@/components/documents/new-folder-dialog"
import { UploadFileDialog } from "@/components/documents/upload-file-dialog"
import { FolderManager } from "@/components/documents/folder-manager"
import { FolderContentManager } from "@/components/documents/folder-content-manager"
import { VisibilityBadge } from "@/components/documents/visibility-badge"
import type { Visibility } from "../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string; folderId: string }>
}

type FolderRow = { id: string; name: string; parent_folder_id: string | null }

/** Recursively build breadcrumb from root to current folder */
async function buildBreadcrumb(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folderId: string,
  condominiumId: string
): Promise<Array<{ id: string; name: string }>> {
  const crumbs: Array<{ id: string; name: string }> = []
  let current: string | null = folderId

  while (current) {
    // eslint-disable-next-line no-await-in-loop
    const { data }: { data: FolderRow | null } = await supabase
      .from("document_folders")
      .select("id, name, parent_folder_id")
      .eq("id", current)
      .eq("condominium_id", condominiumId)
      .single()

    if (!data) break
    crumbs.unshift({ id: data.id, name: data.name })
    current = data.parent_folder_id
  }

  return crumbs
}

export default async function FolderPage({ params }: PageProps) {
  const { condominiumSlug, folderId } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  // Fetch current folder
  const { data: folder } = await supabase
    .from("document_folders")
    .select("id, name, default_visibility, parent_folder_id")
    .eq("id", folderId)
    .eq("condominium_id", condominium.id)
    .single()

  if (!folder) notFound()

  const folderVisibility = folder.default_visibility as Visibility

  // Fetch subfolders
  const { data: subfolders } = await supabase
    .from("document_folders")
    .select("id, name, default_visibility")
    .eq("parent_folder_id", folderId)
    .eq("condominium_id", condominium.id)
    .order("name")

  // Fetch documents in this folder
  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, file_size_bytes, mime_type, visibility_override, created_at")
    .eq("folder_id", folderId)
    .eq("condominium_id", condominium.id)
    .order("name")

  // Count documents for each subfolder
  const subfolderIds = subfolders?.map((f) => f.id) ?? []
  let subfolderCounts: Record<string, number> = {}

  if (subfolderIds.length > 0) {
    const { data: counts } = await supabase
      .from("documents")
      .select("folder_id")
      .in("folder_id", subfolderIds)

    if (counts) {
      subfolderCounts = counts.reduce<Record<string, number>>((acc, row) => {
        if (row.folder_id) acc[row.folder_id] = (acc[row.folder_id] ?? 0) + 1
        return acc
      }, {})
    }
  }

  const subfoldersWithCounts = (subfolders ?? []).map((f) => ({
    ...f,
    default_visibility: f.default_visibility as Visibility,
    document_count: subfolderCounts[f.id] ?? 0,
  }))

  const typedDocuments = (documents ?? []).map((d) => ({
    ...d,
    visibility_override: d.visibility_override as Visibility | null,
  }))

  // Build breadcrumb
  const breadcrumb = await buildBreadcrumb(supabase, folderId, condominium.id)
  const base = `/app/${condominiumSlug}`

  const isEmpty = subfoldersWithCounts.length === 0 && typedDocuments.length === 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <Link href={`${base}/documents`} className="hover:text-foreground transition-colors">
          Documents
        </Link>
        {breadcrumb.map((crumb, idx) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {idx < breadcrumb.length - 1 ? (
              <Link
                href={`${base}/documents/${crumb.id}`}
                className="hover:text-foreground transition-colors"
              >
                {crumb.name}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{crumb.name}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{folder.name}</h1>
            <VisibilityBadge visibility={folderVisibility} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <NewFolderDialog
              condominiumSlug={condominiumSlug}
              parentFolderId={folderId}
            />
            <UploadFileDialog
              condominiumSlug={condominiumSlug}
              folderId={folderId}
            />
          </div>
        )}
      </div>

      {/* Subfolders */}
      {subfoldersWithCounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Subfolders
          </h2>
          <FolderManager
            folders={subfoldersWithCounts}
            condominiumSlug={condominiumSlug}
            parentFolderId={folderId}
            isAdmin={isAdmin}
          />
        </section>
      )}

      {/* Documents */}
      {typedDocuments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Files
          </h2>
          <FolderContentManager
            documents={typedDocuments}
            folderVisibility={folderVisibility}
            condominiumSlug={condominiumSlug}
            isAdmin={isAdmin}
          />
        </section>
      ) : (
        isEmpty && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">This folder is empty.</p>
            {isAdmin && (
              <p className="text-sm mt-1">Upload a file or create a subfolder above.</p>
            )}
          </div>
        )
      )}
    </div>
  )
}
