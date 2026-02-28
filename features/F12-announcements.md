# F12 — Announcements

**Status:** `pending`
**Branch:** `claude/feature-announcements`
**Spec sections:** §6.8 Announcements

---

## Context

Admins publish announcements to all condominium members. Announcements support rich text, optional file attachments, and can be pinned to appear at the top. A notification is sent to all members when published.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `announcements`; storage bucket `announcement-attachments`
- `features/F03-multitenancy-condominium.md` — RLS
- `features/F15-notifications.md` — notification trigger on publish
- `docs/condominium-platform-spec.md` §6.8

---

## Tasks

### Database
- [ ] Migration: `announcements` table
  ```
  id, condominium_id, title, body text (rich text HTML or markdown),
  pinned boolean default false, published_at timestamptz, created_by, created_at
  ```
- [ ] Migration: `announcement_attachments` table
  ```
  id, announcement_id, storage_path, file_name, file_size_bytes, uploaded_by, created_at
  ```
- [ ] RLS: SELECT for all members; INSERT/UPDATE/DELETE for admins only

### Announcement Feed Page
- [ ] Create `app/app/[condominiumSlug]/announcements/page.tsx`:
  - Pinned announcements at top (sorted by published_at DESC within pinned)
  - Then unpinned announcements (sorted by published_at DESC)
  - Each item: title, short body preview, published date, pin indicator
  - "New Announcement" button (admin only)
  - Pagination (or infinite scroll) if many announcements

### Announcement Detail Page
- [ ] Create `app/app/[condominiumSlug]/announcements/[id]/page.tsx`:
  - Full title and rich text body
  - Published date
  - Attached files with download links
  - Admin controls: Edit, Pin/Unpin, Delete

### Create Announcement (Admin)
- [ ] Create `app/app/[condominiumSlug]/announcements/new/page.tsx`
- [ ] Create `components/announcements/announcement-form.tsx`:
  - Title input
  - Rich text editor for body (use a lightweight editor like `@tiptap/react` or `react-quill`)
  - Pin toggle
  - File attachment uploader (multiple files)
  - Publish button (posts immediately) + Save Draft (optional)
- [ ] Server actions in `announcements/actions.ts`:
  - `publishAnnouncement(data, files[])` — creates announcement, uploads attachments, sets published_at to now, triggers notification
  - `updateAnnouncement(id, data)` — update title, body, pin status
  - `deleteAnnouncement(id)` — soft delete or hard delete (remove from Storage + DB)
  - `togglePin(id)` — flips pinned boolean
  - `generateAttachmentDownloadUrl(attachmentId)` → signed URL

### Dashboard Integration
- [ ] Ensure dashboard activity feed (F05) shows latest announcements (links to announcement detail)

---

## Definition of Done

- Admin can publish announcements with rich text and optional file attachments
- Pinned announcements appear at the top of the feed
- All members can read announcements and download attachments
- Notification is triggered on publish (wired to F15 notification system)
- Non-admins cannot create, edit, or delete announcements

---

## Notes

- "Rich text" body: choose either Markdown (store as markdown, render with `react-markdown`) or HTML (store as HTML from a WYSIWYG editor). Markdown is simpler to implement and sanitize.
- `announcement-attachments` Supabase Storage bucket should be private (signed URLs for download)
- No drafts in v1 unless easy to add — published_at = null could indicate draft state
