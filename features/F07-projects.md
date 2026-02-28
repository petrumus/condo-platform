# F07 — Projects

**Status:** `completed`
**Branch:** `claude/build-projects-feature-Gbgrv`
**Spec sections:** §6.3 Projects

---

## Context

Projects track physical or administrative initiatives that are formally approved and being executed. They have a defined lifecycle and can receive progress updates from admins. Documents from the Document Repository can be linked to projects.

**Lifecycle:** `Proposed → Approved → In Progress → Completed → Archived`

**Key files to read before starting:**
- `CLAUDE.md` — schema for `projects`, `project_updates`
- `features/F03-multitenancy-condominium.md` — RLS setup
- `docs/condominium-platform-spec.md` §6.3

---

## Tasks

### Database
- [x] Migration: `projects` table — `supabase/migrations/20260228000006_projects.sql`
  ```
  id, condominium_id, title, description, category, status,
  estimated_cost, actual_cost, start_date, end_date,
  responsible_person, created_by, created_at
  ```
- [x] Migration: `project_updates` table (id, project_id, body text, created_by, created_at)
- [x] RLS: SELECT for all members (approved/in-progress/completed/archived only for users; all for admins)
- [x] RLS: INSERT/UPDATE on `projects` for admin only
- [x] RLS: INSERT on `project_updates` for admin only; SELECT for all members

### Project List Page
- [x] Create `app/app/[condominiumSlug]/projects/page.tsx`:
  - List all projects visible to the current user
  - Show: title, category, status badge, start date, responsible person
  - Filter by status (tab links)
  - Admin sees all statuses including "Proposed"; users see Approved+
  - Link to create new project (admin only)

### Project Detail Page
- [x] Create `app/app/[condominiumSlug]/projects/[id]/page.tsx`:
  - Full project details: title, description, category, status, costs, dates, responsible person
  - Progress updates timeline (newest first)
  - Admin controls: Edit project, Post progress update, Change status (lifecycle button)

### Create / Edit Project (Admin)
- [x] Create `app/app/[condominiumSlug]/projects/new/page.tsx` — create form
- [x] Create `app/app/[condominiumSlug]/projects/[id]/edit/page.tsx` — edit form
- [x] Create `components/projects/project-form.tsx` — shared form for create/edit
  - Fields: title, description, category (Infrastructure|Landscaping|Legal|Administrative|Other), estimated cost, actual cost, start date, expected end date, responsible person (text), status
- [x] Server actions in `app/app/[condominiumSlug]/projects/actions.ts`:
  - `createProject(condominiumSlug, data)`
  - `updateProject(condominiumSlug, id, data)`
  - `postProjectUpdate(condominiumSlug, projectId, body)` — adds a `project_updates` row
  - `changeProjectStatus(condominiumSlug, id, currentStatus, newStatus)` — validates lifecycle transitions

### Components
- [x] Create `components/projects/status-badge.tsx` — colored badge for each status
- [x] Create `components/projects/project-card.tsx` — list item card
- [x] Create `components/projects/project-update-item.tsx` — timeline entry
- [x] Create `components/projects/post-update-form.tsx` — client form to post a progress update
- [x] Create `components/projects/change-status-form.tsx` — client button to advance project lifecycle

### Database Migrations
- `supabase/migrations/20260228000006_projects.sql` — `projects` + `project_updates` tables with RLS

---

## Definition of Done

- Admin can create, edit, and change the status of projects
- Admin can post progress updates visible to all members
- Users can view approved/in-progress/completed/archived projects and their updates
- Users cannot see "Proposed" projects or access edit forms

---

## Notes

- Category list can be hardcoded as a const for v1 (no DB table needed)
- Status lifecycle: only valid transitions allowed (Proposed→Approved, Approved→In Progress, In Progress→Completed, Completed→Archived)
- Linked documents are a loose reference (just display doc names/links from the Document Repository)
