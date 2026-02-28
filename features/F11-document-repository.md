# F11 — Document Repository

**Status:** `completed`
**Branch:** `claude/build-feature-docs-1xnTb`
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
- [x] Migration: `document_folders` table — `supabase/migrations/20260228000009_documents.sql`
  ```
  id, condominium_id, parent_folder_id uuid nullable (self-referencing fk),
  name, default_visibility ('admin-only'|'members'|'public'), created_by, created_at
  ```
- [x] Migration: `documents` table — same migration file
  ```
  id, condominium_id, folder_id uuid nullable fk,
  name, storage_path, file_size_bytes bigint, mime_type text,
  visibility_override ('admin-only'|'members'|'public') nullable,
  uploaded_by, created_at
  ```
- [x] RLS: SELECT `document_folders` based on effective visibility (default_visibility) and user role
- [x] RLS: SELECT `documents` based on effective visibility (visibility_override ?? folder.default_visibility) and user role
- [x] RLS: INSERT/UPDATE/DELETE for admins only on both tables
- [x] DB helper function: `effective_doc_visibility(visibility_override, folder_id)` — returns resolved visibility

### Supabase Storage Setup
- [x] `documents` storage bucket referenced — use signed URLs for download (60s TTL)
- [x] Access check logic in download route and server actions

### Document Repository Page
- [x] Created `app/app/[condominiumSlug]/documents/page.tsx`:
  - Root-level folder list (folders with no parent)
  - Each folder shows: name, visibility badge, file count
  - Admin controls: "New Folder" button, folder actions (edit, delete)

### Folder Contents Page
- [x] Created `app/app/[condominiumSlug]/documents/[folderId]/page.tsx`:
  - Breadcrumb navigation showing folder hierarchy
  - List subfolders and files
  - File row: name, size, upload date, download button
  - Admin controls: upload file, new subfolder, edit/delete items
  - Visibility badge on each item

### Admin: Folder & File Management
- [x] Created `components/documents/new-folder-dialog.tsx` — name + visibility selector (also handles edit)
- [x] Created `components/documents/upload-file-dialog.tsx` — file picker + optional visibility override
- [x] Created `components/documents/edit-item-dialog.tsx` — rename, change visibility + delete confirmation
- [x] Created `components/documents/folder-manager.tsx` — client wrapper for folder grid + edit/delete dialogs
- [x] Created `components/documents/folder-content-manager.tsx` — client wrapper for doc list + edit/delete dialogs
- [x] Created `components/documents/folder-card.tsx` — folder card with visibility badge + file count
- [x] Created `components/documents/document-row.tsx` — file row with download button
- [x] Created `components/documents/visibility-badge.tsx` — colored badge for public/members/admin-only
- [x] Server actions in `app/app/[condominiumSlug]/documents/actions.ts`:
  - `createFolder`, `updateFolder`, `deleteFolder` (blocks if non-empty)
  - `uploadDocument` (MIME type + size validation, uploads to Supabase Storage)
  - `updateDocument`, `deleteDocument` (removes from Storage + DB)
  - `generateDownloadUrl` → signed URL (60s TTL)

### Download Handling
- [x] Created `app/app/[condominiumSlug]/documents/download/route.ts`:
  - GET handler: validates user role vs effective visibility, generates signed URL, redirects
  - Prevents direct public access to Storage paths

---

## Database Migrations

- `supabase/migrations/20260228000009_documents.sql` — `document_folders` + `documents` tables with RLS + `effective_doc_visibility()` function

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
