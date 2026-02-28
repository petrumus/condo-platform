# F11 — Document Repository

**Status:** `pending`
**Branch:** `claude/feature-document-repository`
**Spec sections:** §6.7 Document Repository, §9 Storage Buckets

---

## Context

Hierarchical folder structure for storing and sharing files. Backed by Supabase Storage. Each folder has a default visibility level; individual files can override it. Three visibility levels: `admin-only`, `all-members`, `public`.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `documents`, `document_folders`; storage buckets list
- `features/F03-multitenancy-condominium.md` — RLS setup
- `docs/condominium-platform-spec.md` §6.7, §9

---

## Tasks

### Database
- [ ] Migration: `document_folders` table
  ```
  id, condominium_id, parent_folder_id uuid nullable (self-referencing fk),
  name, default_visibility ('admin-only'|'all-members'|'public'), created_by, created_at
  ```
- [ ] Migration: `documents` table
  ```
  id, condominium_id, folder_id uuid nullable fk,
  name, storage_path, file_size_bytes bigint, mime_type text,
  visibility_override ('admin-only'|'all-members'|'public') nullable,
  uploaded_by, created_at
  ```
- [ ] RLS: SELECT `document_folders` based on effective visibility (default_visibility) and user role
- [ ] RLS: SELECT `documents` based on effective visibility (visibility_override ?? folder.default_visibility) and user role
- [ ] RLS: INSERT/UPDATE/DELETE for admins only on both tables
- [ ] DB helper function: `effective_visibility(folder_id, visibility_override)` — returns resolved visibility

### Supabase Storage Setup
- [ ] Create `documents` storage bucket with private access (signed URLs for download)
- [ ] Storage RLS policy: users can only download files they have SELECT access to (via a Postgres function check)

### Document Repository Page
- [ ] Create `app/app/[condominiumSlug]/documents/page.tsx`:
  - Root-level folder list (folders with no parent)
  - Each folder shows: name, visibility badge, file count
  - Admin controls: "New Folder" button, folder actions (edit, delete)
  - Public documents note: "Some documents are publicly accessible"

### Folder Contents Page
- [ ] Create `app/app/[condominiumSlug]/documents/[folderId]/page.tsx`:
  - Breadcrumb navigation showing folder hierarchy
  - List subfolders and files
  - File row: name, size, upload date, download button
  - Admin controls: upload file, new subfolder, edit/delete items
  - Visibility badge on each item

### Admin: Folder & File Management
- [ ] Create `components/documents/new-folder-dialog.tsx` — name + visibility selector
- [ ] Create `components/documents/upload-file-dialog.tsx` — file picker + optional visibility override
- [ ] Create `components/documents/edit-item-dialog.tsx` — rename, change visibility
- [ ] Server actions in `documents/actions.ts`:
  - `createFolder(condominiumId, parentFolderId, name, visibility)`
  - `updateFolder(id, name, visibility)`
  - `deleteFolder(id)` — only if empty
  - `uploadDocument(folderId, file, visibilityOverride?)` — uploads to Supabase Storage, creates DB row
  - `deleteDocument(id)` — removes from Storage + DB
  - `generateDownloadUrl(documentId)` → signed URL (short TTL, e.g. 60s)

### Download Handling
- [ ] Create `app/app/[condominiumSlug]/documents/download/route.ts`:
  - GET handler: validates user has access to document, generates signed URL, redirects
  - Prevents direct public access to Storage paths

---

## Definition of Done

- Admin can create folder hierarchy, upload files, and set visibility per folder/file
- Users see only folders/files they have access to based on their role
- Public files are accessible without login (via a public route or signed URL)
- File download works via redirect to signed Supabase Storage URL
- Non-admins cannot upload, create folders, or delete files

---

## Notes

- `public` visibility files should use a long-lived or public URL; `all-members` and `admin-only` use short-TTL signed URLs
- Supported file types per spec: PDF, DOCX, XLSX, images, and common document formats — validate MIME type on upload
- Do not store files in the DB; only `storage_path` (the Supabase Storage path)
- Deleting a folder should cascade-delete its documents from both Storage and DB
