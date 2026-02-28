# F07 — Projects

**Status:** `pending`
**Branch:** `claude/feature-projects`
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
- [ ] Migration: `projects` table
  ```
  id, condominium_id, title, description, category, status,
  estimated_cost, actual_cost, start_date, expected_end_date,
  actual_end_date, responsible_person, created_by, created_at
  ```
- [ ] Migration: `project_updates` table (id, project_id, body text, created_by, created_at)
- [ ] RLS: SELECT for all members (approved/in-progress/completed/archived only for users; all for admins)
- [ ] RLS: INSERT/UPDATE on `projects` for admin only
- [ ] RLS: INSERT on `project_updates` for admin only; SELECT for all members

### Project List Page
- [ ] Create `app/app/[condominiumSlug]/projects/page.tsx`:
  - List all projects visible to the current user
  - Show: title, category, status badge, start date, responsible person
  - Filter by status (tabs or dropdown)
  - Admin sees all statuses including "Proposed"; users see Approved+
  - Link to create new project (admin only)

### Project Detail Page
- [ ] Create `app/app/[condominiumSlug]/projects/[id]/page.tsx`:
  - Full project details: title, description, category, status, costs, dates, responsible person
  - Progress updates timeline (newest first)
  - Linked documents section (references to `documents` table — wired in F11)
  - Admin controls: Edit project, Post progress update, Change status

### Create / Edit Project (Admin)
- [ ] Create `app/app/[condominiumSlug]/projects/new/page.tsx` — create form
- [ ] Create `app/app/[condominiumSlug]/projects/[id]/edit/page.tsx` — edit form
- [ ] Create `components/projects/project-form.tsx` — shared form for create/edit
  - Fields: title, description, category (Infrastructure|Landscaping|Legal|Administrative|Other), estimated cost, start date, expected end date, responsible person (text), status
- [ ] Server actions in `projects/actions.ts`:
  - `createProject(data)`
  - `updateProject(id, data)`
  - `postProjectUpdate(projectId, body)` — adds a `project_updates` row
  - `changeProjectStatus(id, newStatus)` — validates lifecycle transitions

### Components
- [ ] Create `components/projects/status-badge.tsx` — colored badge for each status
- [ ] Create `components/projects/project-card.tsx` — list item card
- [ ] Create `components/projects/project-update-item.tsx` — timeline entry

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
