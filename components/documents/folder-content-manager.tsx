"use client"

import { useState } from "react"
import { DocumentRow } from "./document-row"
import { EditDocumentDialog, DeleteDocumentDialog } from "./edit-item-dialog"
import type { Visibility } from "@/app/app/[condominiumSlug]/documents/actions"

interface DocumentItem {
  id: string
  name: string
  file_size_bytes: number | null
  mime_type: string | null
  created_at: string
  visibility_override: Visibility | null
}

interface FolderContentManagerProps {
  documents: DocumentItem[]
  folderVisibility: Visibility
  condominiumSlug: string
  isAdmin: boolean
}

export function FolderContentManager({
  documents,
  folderVisibility,
  condominiumSlug,
  isAdmin,
}: FolderContentManagerProps) {
  const [editDoc, setEditDoc] = useState<DocumentItem | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<{ id: string; name: string } | null>(null)

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            effectiveVisibility={doc.visibility_override ?? folderVisibility}
            condominiumSlug={condominiumSlug}
            isAdmin={isAdmin}
            onEdit={isAdmin ? (d) => setEditDoc(d as DocumentItem) : undefined}
            onDelete={isAdmin ? (d) => setDeleteDoc(d) : undefined}
          />
        ))}
      </div>

      <EditDocumentDialog
        condominiumSlug={condominiumSlug}
        document={editDoc}
        open={Boolean(editDoc)}
        onOpenChange={(val) => { if (!val) setEditDoc(null) }}
      />

      <DeleteDocumentDialog
        condominiumSlug={condominiumSlug}
        document={deleteDoc}
        open={Boolean(deleteDoc)}
        onOpenChange={(val) => { if (!val) setDeleteDoc(null) }}
      />
    </>
  )
}
