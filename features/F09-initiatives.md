# F09 — Initiatives

**Status:** `pending`
**Branch:** `claude/feature-initiatives`
**Spec sections:** §6.5 Initiatives

---

## Context

Any authenticated condominium member can submit an initiative (idea or request). Initiatives stay private until approved by an admin. Admins can approve, reject with a reason, or directly convert an initiative into a Project or Ballot. Submitters are notified on status changes.

**Lifecycle:** `Draft → Pending Review → Approved → Rejected → Converted`

**Key files to read before starting:**
- `CLAUDE.md` — schema for `initiatives`
- `features/F03-multitenancy-condominium.md` — RLS
- `features/F07-projects.md` — conversion to project
- `features/F10-ballots-voting.md` — conversion to ballot
- `condominium-platform-spec.md` §6.5

---

## Tasks

### Database
- [ ] Migration: `initiatives` table
  ```
  id, condominium_id, title, description, category, status
  ('draft'|'pending_review'|'approved'|'rejected'|'converted'),
  submitter_id, admin_notes, created_at
  ```
- [ ] Migration: `initiative_attachments` table (id, initiative_id, storage_path, file_name, uploaded_by, created_at)
- [ ] RLS: submitter can SELECT their own initiatives (all statuses); admins can SELECT all; non-submitters can only SELECT 'approved' and 'converted' initiatives
- [ ] RLS: INSERT for all authenticated members; UPDATE for admins only (for status, admin_notes)

### Initiative List Page (All Users)
- [ ] Create `app/app/[condominiumSlug]/initiatives/page.tsx`:
  - Users see: approved + converted initiatives
  - Admins see: all initiatives (tabs: All | Pending Review | Approved | Rejected)
  - Show: title, category, status badge, submitter name, submitted date
  - "Submit Initiative" button visible to all

### Submit Initiative
- [ ] Create `app/app/[condominiumSlug]/initiatives/new/page.tsx`:
  - Form: title, description, category (free text or select), file attachments (optional)
  - On submit: creates initiative with status 'pending_review'
  - Upload attachments to Supabase Storage `initiative-attachments` bucket
- [ ] Server actions in `initiatives/actions.ts`:
  - `submitInitiative(data, files[])` — creates initiative + uploads attachments

### Initiative Detail Page
- [ ] Create `app/app/[condominiumSlug]/initiatives/[id]/page.tsx`:
  - Full details: title, description, category, submitter, submitted date, status, admin notes (if rejected)
  - Attached files list with download links
  - Admin controls section (only visible to admins):
    - Approve button
    - Reject button (opens modal to enter rejection reason)
    - Convert to Project button
    - Convert to Ballot button

### Admin Review Page
- [ ] Create `app/app/[condominiumSlug]/initiatives/review/page.tsx`:
  - Admin-only page
  - Lists all 'pending_review' initiatives
  - Quick action buttons: Approve, Reject, View

### Server Actions (Admin)
- [ ] `approveInitiative(id)` — sets status to 'approved', triggers notification
- [ ] `rejectInitiative(id, reason)` — sets status to 'rejected', stores reason in admin_notes, triggers notification
- [ ] `convertToProject(id)` — creates a new project from initiative data, sets status to 'converted'; redirects to project create form pre-filled with initiative data
- [ ] `convertToBallot(id)` — same pattern for ballot; redirects to ballot create form pre-filled

---

## Definition of Done

- Any member can submit an initiative with optional file attachments
- Admins can approve, reject, or convert initiatives
- Users can only see approved/converted initiatives (not others' drafts or pending)
- Submitters see their own initiatives in any status
- Notification triggers fire on status changes (wired in F15)

---

## Notes

- File uploads go to `initiative-attachments` Supabase Storage bucket
- RLS on `initiative_attachments` should mirror initiative visibility (if initiative is private, so are its attachments)
- "Convert to Ballot" and "Convert to Project" do NOT delete the initiative — they set it to 'converted' and create the new entity
- Admin notes / rejection reason are stored in `admin_notes` field
