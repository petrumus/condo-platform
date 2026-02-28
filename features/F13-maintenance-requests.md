# F13 — Maintenance Requests

**Status:** `completed`
**Branch:** `claude/build-maintenance-requests-VnTco`
**Spec sections:** §6.9 Maintenance Requests

---

## Context

Residents submit maintenance or repair requests. Admins view all requests, update status, and add resolution notes. Submitters are notified on status changes. Optional photo attachments.

**Lifecycle:** `Open → In Review → In Progress → Resolved → Closed`

**Key files to read before starting:**
- `CLAUDE.md` — schema for `maintenance_requests`; storage bucket `maintenance-attachments`
- `features/F03-multitenancy-condominium.md` — RLS
- `features/F15-notifications.md` — notification on status change
- `docs/condominium-platform-spec.md` §6.9

---

## Tasks

### Database
- [x] Migration: `maintenance_requests` table
  ```
  id, condominium_id, submitter_id, title, description, category, location,
  priority ('low'|'medium'|'high'), status ('open'|'in_review'|'in_progress'|'resolved'|'closed'),
  admin_notes text, created_at, updated_at
  ```
- [x] Migration: `maintenance_attachments` table
  ```
  id, request_id, storage_path, file_name, file_size_bytes, uploaded_by, created_at
  ```
- [x] RLS: submitter can SELECT their own requests (all statuses); admins can SELECT all
- [x] RLS: INSERT for all authenticated members; UPDATE status/admin_notes for admins only

### Maintenance Request List Page
- [x] Create `app/app/[condominiumSlug]/maintenance/page.tsx`:
  - Users see: their own requests, sorted by created_at DESC
  - Admins see: all requests, with filters by status, category, priority
  - Each row: title, category, priority badge, status badge, submitted date
  - "Submit Request" button for all users

### Submit Request
- [x] Create `app/app/[condominiumSlug]/maintenance/new/page.tsx`:
  - Form fields: title, description, category (Plumbing|Electrical|Common Areas|Elevator|Other), location (text), priority (Low/Medium/High), photo attachments (optional, multiple)
  - Upload photos to `maintenance-attachments` Supabase Storage bucket
- [x] Server action: `submitMaintenanceRequest(data, photos[])` — creates request + uploads attachments

### Request Detail Page
- [x] Create `app/app/[condominiumSlug]/maintenance/[id]/page.tsx`:
  - Full details: title, description, category, location, priority, status, submitted date
  - Photos gallery (thumbnail grid, click to enlarge lightbox)
  - Admin notes / resolution description (if any)
  - Admin controls:
    - Status updater (dropdown + save)
    - Admin notes textarea + save
    - Priority adjustment
  - Submitter sees read-only view of their own request

### Server Actions (Admin)
- [x] Server actions in `maintenance/actions.ts`:
  - `updateRequestStatus(id, newStatus, adminNotes?)` — updates status + optional notes
  - `updateAdminNotes(id, notes)` — update notes only
  - `updatePriority(id, priority)` — admin can adjust priority
  - `generatePhotoUrl(attachmentId)` → signed URL (300s expiry)

---

## Database Migrations

- `supabase/migrations/20260228000011_maintenance.sql` — `maintenance_requests` + `maintenance_attachments` tables with RLS

---

## Definition of Done

- Any member can submit a maintenance request with optional photos
- Admins can view all requests and filter by status/category/priority
- Admins can update status and add resolution notes
- Submitters receive notifications on status changes (F15)
- Photo uploads work and display correctly in the detail view

---

## Notes

- `maintenance-attachments` bucket is private — photos served via signed URLs
- Category list: Plumbing, Electrical, Common Areas, Elevator, Other (hardcoded for v1)
- Priority can be set by submitter and adjusted by admin
- Status lifecycle: Open → In Review → In Progress → Resolved → Closed (only forward; admin can skip steps)
