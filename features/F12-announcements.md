# F12 — Announcements

**Status:** `completed`
**Branch:** `claude/build-announcements-feature-rbxuB`
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
- [x] Migration: `announcements` table (`supabase/migrations/20260228000010_announcements.sql`)
  ```
  id, condominium_id, title, body text, pinned boolean default false, published_at timestamptz, created_by, created_at
  ```
- [x] Migration: `announcement_attachments` table (same migration file)
  ```
  id, announcement_id, storage_path, file_name, file_size_bytes, uploaded_by, created_at
  ```
- [x] RLS: SELECT for all members (published only); INSERT/UPDATE/DELETE for admins only

### Announcement Feed Page
- [x] Created `app/app/[condominiumSlug]/announcements/page.tsx`:
  - Pinned announcements at top (sorted by published_at DESC within pinned)
  - Then unpinned announcements (sorted by published_at DESC)
  - Each item: title, short body preview, published date, pin indicator
  - "New Announcement" button (admin only)

### Announcement Detail Page
- [x] Created `app/app/[condominiumSlug]/announcements/[id]/page.tsx`:
  - Full title and body (plain text with whitespace-pre-wrap)
  - Published date
  - Attached files with download buttons (signed URL via server action)
  - Admin controls: Edit, Pin/Unpin, Delete

### Create/Edit Announcement (Admin)
- [x] Created `app/app/[condominiumSlug]/announcements/new/page.tsx`
- [x] Created `app/app/[condominiumSlug]/announcements/[id]/edit/page.tsx`
- [x] Created `components/announcements/announcement-form.tsx`:
  - Title input
  - Textarea for body (plain text, whitespace-pre-wrap rendered)
  - Pin toggle (checkbox)
  - Multiple file attachment uploader
  - Publish button (sets published_at to now)
- [x] Server actions in `app/app/[condominiumSlug]/announcements/actions.ts`:
  - `publishAnnouncement(condominiumSlug, formData)` — creates announcement, uploads attachments
  - `updateAnnouncement(condominiumSlug, id, formData)` — update title, body, pin + new files
  - `deleteAnnouncement(condominiumSlug, id)` — removes from Storage + DB
  - `togglePin(condominiumSlug, id, currentPinned)` — flips pinned boolean
  - `deleteAttachment(condominiumSlug, attachmentId)` — removes single attachment
  - `generateAttachmentDownloadUrl(condominiumSlug, attachmentId)` → signed URL

### Components
- [x] `components/announcements/announcement-card.tsx` — card for feed
- [x] `components/announcements/announcement-form.tsx` — create/edit form
- [x] `components/announcements/pin-button.tsx` — pin/unpin toggle (admin)
- [x] `components/announcements/delete-announcement-button.tsx` — delete with confirmation dialog
- [x] `components/announcements/delete-attachment-button.tsx` — per-attachment delete dialog
- [x] `components/announcements/attachment-download-button.tsx` — signed URL download

### Dashboard Integration
- [x] Dashboard activity feed (F05) already queries `announcements` table and links to detail pages

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
