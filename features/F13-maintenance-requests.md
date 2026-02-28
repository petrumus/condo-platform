# F13 — Maintenance Requests

**Status:** `pending`
**Branch:** `claude/feature-maintenance-requests`
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
- [ ] Migration: `maintenance_requests` table
  ```
  id, condominium_id, submitter_id, title, description, category, location,
  priority ('low'|'medium'|'high'), status ('open'|'in_review'|'in_progress'|'resolved'|'closed'),
  admin_notes text, created_at, updated_at
  ```
- [ ] Migration: `maintenance_attachments` table
  ```
  id, request_id, storage_path, file_name, file_size_bytes, uploaded_by, created_at
  ```
- [ ] RLS: submitter can SELECT their own requests (all statuses); admins can SELECT all
- [ ] RLS: INSERT for all authenticated members; UPDATE status/admin_notes for admins only

### Maintenance Request List Page
- [ ] Create `app/app/[condominiumSlug]/maintenance/page.tsx`:
  - Users see: their own requests, sorted by created_at DESC
  - Admins see: all requests, with filters by status, category, priority
  - Each row: title, category, priority badge, status badge, submitted date
  - "Submit Request" button for all users
  - Admin: batch actions (e.g. change status)

### Submit Request
- [ ] Create `app/app/[condominiumSlug]/maintenance/new/page.tsx`:
  - Form fields: title, description, category (Plumbing|Electrical|Common Areas|Elevator|Other), location (text), priority (Low/Medium/High), photo attachments (optional, multiple)
  - Upload photos to `maintenance-attachments` Supabase Storage bucket
- [ ] Server action: `submitMaintenanceRequest(data, photos[])` — creates request + uploads attachments

### Request Detail Page
- [ ] Create `app/app/[condominiumSlug]/maintenance/[id]/page.tsx`:
  - Full details: title, description, category, location, priority, status, submitted date
  - Photos gallery (thumbnail grid, click to enlarge)
  - Admin notes / resolution description (if any)
  - Status history timeline (optional, using updated_at + status changes)
  - Admin controls:
    - Status updater (dropdown + save)
    - Admin notes textarea + save
    - Priority adjustment
  - Submitter sees read-only view of their own request

### Server Actions (Admin)
- [ ] Server actions in `maintenance/actions.ts`:
  - `updateRequestStatus(id, newStatus, adminNotes?)` — updates status + optional notes, triggers notification
  - `updateAdminNotes(id, notes)` — update notes only
  - `updatePriority(id, priority)` — admin can adjust priority
  - `generatePhotoUrl(attachmentId)` → signed URL

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
