import { notFound, redirect } from "next/navigation"
import { FolderOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { FolderManager } from "@/components/documents/folder-manager"
import { NewFolderDialog } from "@/components/documents/new-folder-dialog"
import type { Visibility } from "./actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function DocumentsPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  // Fetch root-level folders (no parent)
  const { data: folders } = await supabase
    .from("document_folders")
    .select("id, name, default_visibility")
    .eq("condominium_id", condominium.id)
    .is("parent_folder_id", null)
    .order("name")

  // Count documents in each folder
  const folderIds = folders?.map((f) => f.id) ?? []
  let folderCounts: Record<string, number> = {}

  if (folderIds.length > 0) {
    const { data: counts } = await supabase
      .from("documents")
      .select("folder_id")
      .in("folder_id", folderIds)

    if (counts) {
      folderCounts = counts.reduce<Record<string, number>>((acc, row) => {
        if (row.folder_id) acc[row.folder_id] = (acc[row.folder_id] ?? 0) + 1
        return acc
      }, {})
    }
  }

  const foldersWithCounts = (folders ?? []).map((f) => ({
    ...f,
    default_visibility: f.default_visibility as Visibility,
    document_count: folderCounts[f.id] ?? 0,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
        </div>
        {isAdmin && (
          <NewFolderDialog condominiumSlug={condominiumSlug} parentFolderId={null} />
        )}
      </div>

      {/* Info note */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
        Documents are organized in folders. Each folder has a default visibility that controls
        who can see its contents. Individual files can override the folder&apos;s visibility.
      </div>

      {/* Folder grid */}
      {foldersWithCounts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p className="text-sm">No folders yet.</p>
          {isAdmin && (
            <p className="text-sm mt-1">Create a folder above to start organizing documents.</p>
          )}
        </div>
      ) : (
        <FolderManager
          folders={foldersWithCounts}
          condominiumSlug={condominiumSlug}
          parentFolderId={null}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
