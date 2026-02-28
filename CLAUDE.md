# Condominium Platform — Claude Project Guide

> **Purpose:** This file is the single source of truth for Claude sessions. Read this file at the start of every session instead of re-scanning the full repo. Update it whenever a feature is started or completed.

---

## Project Overview

A multi-tenant SaaS platform for condominium management. Each condominium is an isolated workspace. Three system roles: `super-admin` (platform-wide), `admin` (per-condominium), `user` (per-condominium).

**Full spec:** `docs/condominium-platform-spec.md`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui (to be installed) |
| Backend / DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth — Google OAuth |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Workflow Automation | n8n (email notifications, scheduled jobs) |
| Hosting | Vercel (frontend) + Hetzner (n8n) |

---

## Repo Map

```
/
├── CLAUDE.md                        ← This file (project guide & progress tracker)
├── middleware.ts                     ← Next.js middleware (Supabase session refresh)
├── docs/
│   ├── condominium-platform-spec.md ← Full product specification
│   └── n8n-webhooks.md              ← n8n webhook payload reference (added in F15)
├── features/                        ← Feature task files (one per feature)
│   ├── F01-project-foundation.md
│   ├── F02-authentication.md
│   ├── F03-multitenancy-condominium.md
│   └── F04–F18 ...                  ← Remaining features (pending)
├── supabase/migrations/             ← SQL migrations applied via `supabase db push`
│   ├── 20260228000000_base_schema.sql
│   ├── 20260228000001_invitations.sql
│   ├── 20260228000002_condominium_helpers.sql
│   ├── 20260228000003_profiles.sql      ← profiles table + sync trigger (F04)
│   ├── 20260228000004_budget.sql        ← budget_plans + budget_line_items (F06)
│   ├── 20260228000005_super_admin.sql   ← condominiums.status + audit_logs + profiles RLS (F17)
│   ├── 20260228000006_projects.sql      ← projects + project_updates tables with RLS (F07)
│   ├── 20260228000007_initiatives.sql   ← initiatives + initiative_attachments tables with RLS (F09)
│   ├── 20260228000008_ballots.sql       ← ballots + votes tables + has_voted() function (F10)
│   ├── 20260228000009_documents.sql     ← document_folders + documents tables with RLS + effective_doc_visibility() (F11)
│   ├── 20260228000010_announcements.sql ← announcements + announcement_attachments tables with RLS (F12)
│   ├── 20260228000011_maintenance.sql  ← maintenance_requests + maintenance_attachments tables with RLS (F13)
│   ├── 20260228000012_units.sql        ← units + unit_owners tables with RLS (F14)
│   └── 20260228000013_notifications.sql ← notifications table with RLS + realtime (F15)
├── app/                             ← Next.js App Router
│   ├── layout.tsx                   ← Root layout (Geist fonts, Analytics)
│   ├── page.tsx                     ← Login page (Google OAuth)
│   ├── global-error.tsx             ← Global error boundary (fallback for uncaught errors)
│   ├── globals.css
│   ├── app/
│   │   └── page.tsx                 ← Condominium picker (for users with multiple memberships)
│   ├── auth/
│   │   ├── actions.ts               ← signInWithGoogle, signOut server actions
│   │   ├── callback/route.ts        ← OAuth callback handler
│   │   └── confirm/page.tsx         ← "Check your email" page
│   ├── app/[condominiumSlug]/
│   │   ├── layout.tsx               ← Tenant layout (navbar, context provider)
│   │   ├── page.tsx                 ← Slug root redirect → dashboard
│   └── dashboard/page.tsx       ← Dashboard (condominium header, nav cards, activity feed)
│       ├── budget/
│       │   ├── actions.ts               ← Budget server actions (F06)
│       │   ├── [year]/page.tsx          ← Budget read view (F06)
│       │   └── [year]/edit/page.tsx     ← Budget editor, admin only (F06)
│       ├── projects/
│       │   ├── actions.ts               ← Projects server actions (F07)
│       │   ├── page.tsx                 ← Projects list with status tabs (F07)
│       │   ├── new/page.tsx             ← Create project, admin only (F07)
│       │   └── [id]/
│       │       ├── page.tsx             ← Project detail + progress updates (F07)
│       │       └── edit/page.tsx        ← Edit project, admin only (F07)
│       ├── administration/
│       │   └── page.tsx                 ← Governance team page (F08)
│       ├── initiatives/
│       │   ├── actions.ts               ← Initiatives server actions (F09)
│       │   ├── page.tsx                 ← Initiatives list with status tabs (F09)
│       │   ├── new/page.tsx             ← Submit initiative form (F09)
│       │   ├── review/page.tsx          ← Admin review queue (F09)
│       │   └── [id]/page.tsx            ← Initiative detail + admin controls (F09)
│       ├── ballots/
│       │   ├── actions.ts               ← Ballots server actions (F10)
│       │   ├── page.tsx                 ← Ballots list with status tabs (F10)
│       │   ├── new/page.tsx             ← Create ballot, admin only (F10)
│       │   └── [id]/
│       │       ├── page.tsx             ← Ballot detail + voting interface (F10)
│       │       ├── edit/page.tsx        ← Edit draft ballot, admin only (F10)
│       │       └── results/page.tsx     ← Results with tally + CSV export (F10)
│       ├── documents/
│       │   ├── actions.ts               ← Documents server actions (F11)
│       │   ├── page.tsx                 ← Root folder list (F11)
│       │   ├── [folderId]/page.tsx      ← Folder contents with breadcrumb (F11)
│       │   └── download/route.ts        ← Signed URL redirect handler (F11)
│   ├── invite/[token]/
│   │   ├── page.tsx                 ← Invitation acceptance page
│   │   └── actions.ts               ← Accept invitation server action
│   ├── pending/page.tsx             ← No-membership landing page
│   ├── privacy/page.tsx             ← Privacy policy
│   ├── terms/page.tsx               ← Terms of service
│   ├── super-admin/layout.tsx       ← Super-admin shell layout (nav links added in F17)
│   ├── super-admin/error.tsx        ← Super-admin error boundary
│   ├── super-admin/condominiums/
│   │   ├── page.tsx                 ← Condominiums list with search (F17)
│   │   ├── actions.ts               ← Super-admin server actions (F17)
│   │   ├── condominium-row-actions.tsx ← Row actions client component (F17)
│   │   ├── new/page.tsx             ← Create condominium page (F17)
│   │   ├── new/create-condominium-form.tsx ← Create form with slug generation (F17)
│   │   └── [id]/
│   │       ├── page.tsx             ← Condominium detail page (F17)
│   │       ├── edit-condominium-form.tsx ← Edit form (F17)
│   │       ├── invite-admin-form.tsx ← Invite admin by email (F17)
│   │       ├── member-row.tsx       ← Member row with role select (F17)
│   │       └── danger-zone.tsx      ← Suspend/delete with confirmation (F17)
│   ├── super-admin/audit-log/
│   │   └── page.tsx                 ← Platform-wide audit log (F17)
│   └── suspended/page.tsx           ← Suspended condominium landing page (F17)
│       ├── announcements/
│       │   ├── actions.ts               ← Announcements server actions (F12)
│       │   ├── page.tsx                 ← Announcements feed: pinned + unpinned (F12)
│       │   ├── new/page.tsx             ← Create announcement, admin only (F12)
│       │   └── [id]/
│       │       ├── page.tsx             ← Announcement detail + admin controls (F12)
│       │       └── edit/page.tsx        ← Edit announcement, admin only (F12)
│       ├── maintenance/
│       │   ├── actions.ts               ← Maintenance server actions (F13)
│       │   ├── page.tsx                 ← Requests list with status tabs (F13)
│       │   ├── new/page.tsx             ← Submit request form (F13)
│       │   └── [id]/page.tsx            ← Request detail + admin controls + photo gallery (F13)
│       ├── notifications/
│       │   ├── actions.ts               ← Notification server actions: markRead, markAllRead (F15)
│       │   └── page.tsx                 ← Full notifications list with type badges (F15)
│       ├── settings/
│       │   ├── audit-log/
│       │   │   └── page.tsx             ← Admin audit log: filterable + paginated (F16)
│       │   └── units/
│       │       ├── actions.ts           ← Units server actions: CRUD + owner management + recalculate (F14)
│       │       ├── page.tsx             ← Admin unit register: table, add/edit/delete, owners (F14)
│       │       └── my-unit/page.tsx     ← User: view own linked unit(s) (F14)
├── hooks/
│   └── use-notifications.ts             ← Realtime notifications hook (F15)
├── lib/
│   ├── auth/get-user.ts             ← Server-side current user helper
│   ├── auth/get-membership.ts       ← User membership query helper
│   ├── condominium/get-condominium.ts ← Fetch condominium by slug
│   ├── condominium/get-user-role.ts ← Get user's role in a condominium
│   ├── context/condominium-context.tsx ← React context for tenant data
│   ├── supabase/client.ts           ← Browser Supabase client
│   ├── supabase/server.ts           ← Server Supabase client
│   ├── supabase/middleware.ts        ← Middleware session update helper
│   ├── types/database.ts            ← Generated Supabase DB types
│   ├── audit/
│   │   └── log-action.ts            ← logAction() helper using service role (F16)
│   ├── notifications/
│   │   └── create-notification.ts   ← createNotification + createNotificationForAllMembers (F15)
│   ├── queries/
│   │   └── administration.ts        ← getGovernanceMembers query (F08)
│   ├── types/index.ts               ← Shared type exports
│   └── utils.ts                     ← cn() and other utilities
├── components/
│   ├── announcements/
│   │   ├── announcement-card.tsx        ← Feed card with body preview + pin indicator (F12)
│   │   ├── announcement-form.tsx        ← Create/edit form with file attachments (F12)
│   │   ├── pin-button.tsx               ← Admin pin/unpin toggle (F12)
│   │   ├── delete-announcement-button.tsx ← Delete with confirmation dialog (F12)
│   │   ├── delete-attachment-button.tsx  ← Per-attachment delete dialog (F12)
│   │   └── attachment-download-button.tsx ← Signed URL download button (F12)
│   ├── logo.tsx                     ← SVG logo component
│   ├── layout/navbar.tsx            ← Top navigation bar
│   ├── administration/
│   │   ├── governance-member-card.tsx ← Avatar + name + title + email card (F08)
│   │   └── governance-grid.tsx      ← Responsive card grid (F08)
│   ├── budget/
│   │   ├── budget-table.tsx         ← Read-only budget line items table (F06)
│   │   ├── budget-editor.tsx        ← Interactive budget editor client component (F06)
│   │   └── year-selector.tsx        ← Year navigation for budgets (F06)
│   ├── initiatives/
│   │   ├── initiative-status-badge.tsx  ← Colored status badge (F09)
│   │   ├── initiative-card.tsx          ← Initiative list card (F09)
│   │   ├── initiative-form.tsx          ← Submit initiative form (F09)
│   │   └── admin-initiative-actions.tsx ← Admin approve/reject/convert controls (F09)
│   ├── ballots/
│   │   ├── ballot-status-badge.tsx      ← Colored status badge (F10)
│   │   ├── ballot-card.tsx              ← Ballot list card with voting indicator (F10)
│   │   ├── ballot-form.tsx              ← Create/edit ballot form (F10)
│   │   ├── vote-form.tsx                ← Voting interface (yes/no, single, multi) (F10)
│   │   ├── ballot-admin-actions.tsx     ← Admin lifecycle controls (F10)
│   │   └── export-csv-button.tsx        ← Results CSV export button (F10)
│   ├── projects/
│   │   ├── status-badge.tsx         ← Colored badge for each project status (F07)
│   │   ├── project-card.tsx         ← Project list card (F07)
│   │   ├── project-update-item.tsx  ← Timeline entry for progress updates (F07)
│   │   ├── project-form.tsx         ← Shared create/edit form client component (F07)
│   │   ├── post-update-form.tsx     ← Admin form to post progress update (F07)
│   │   └── change-status-form.tsx   ← Admin button to advance project lifecycle (F07)
│   ├── dashboard/
│   │   ├── nav-card.tsx             ← Navigation card (icon + title + description)
│   │   └── activity-feed.tsx        ← Recent activity feed (announcements, ballots, initiatives)
│   ├── maintenance/
│   │   ├── maintenance-status-badge.tsx     ← Colored badge for each status (F13)
│   │   ├── maintenance-priority-badge.tsx   ← Colored badge for low/medium/high (F13)
│   │   ├── maintenance-request-card.tsx     ← Request list card (F13)
│   │   ├── maintenance-request-form.tsx     ← Submit request form with photo upload (F13)
│   │   ├── admin-maintenance-actions.tsx    ← Admin status/priority/notes controls (F13)
│   │   └── photo-gallery.tsx               ← On-demand signed-URL photo gallery + lightbox (F13)
│   ├── settings/
│   │   └── units/
│   │       ├── unit-dialog.tsx              ← Add/edit unit modal form (F14)
│   │       ├── unit-owners-dialog.tsx       ← Manage owners per unit (add registered/unregistered, remove) (F14)
│   │       └── units-table.tsx             ← Client table with edit/delete/owners dialogs + recalculate (F14)
│   ├── documents/
│   │   ├── visibility-badge.tsx         ← Colored badge for public/members/admin-only (F11)
│   │   ├── folder-card.tsx              ← Folder card with visibility badge + file count (F11)
│   │   ├── document-row.tsx             ← File row with inline download button (F11)
│   │   ├── folder-manager.tsx           ← Client wrapper for folder grid + edit/delete dialogs (F11)
│   │   ├── folder-content-manager.tsx   ← Client wrapper for doc list + edit/delete dialogs (F11)
│   │   ├── new-folder-dialog.tsx        ← Create/edit folder dialog (F11)
│   │   ├── upload-file-dialog.tsx       ← File upload dialog with visibility override (F11)
│   │   └── edit-item-dialog.tsx         ← Edit/delete document dialogs (F11)
│   ├── notifications/
│   │   └── notification-bell.tsx        ← Bell icon with unread badge, dropdown, realtime (F15)
│   └── ui/                          ← shadcn/ui components (button, input, etc.)
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── postcss.config.mjs
```

### Planned App Router Structure (after features are built)

```
app/
├── page.tsx                              → Marketing / login page
├── auth/
│   └── callback/route.ts                → OAuth/email callback handler
├── app/
│   └── [condominiumSlug]/
│       ├── dashboard/page.tsx
│       ├── budget/
│       │   ├── [year]/page.tsx
│       │   └── [year]/edit/page.tsx
│       ├── projects/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       ├── administration/page.tsx
│       ├── initiatives/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   ├── review/page.tsx
│       │   └── [id]/page.tsx
│       ├── ballots/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── results/page.tsx
│       ├── documents/
│       │   ├── page.tsx
│       │   └── [folderId]/page.tsx
│       ├── announcements/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       ├── maintenance/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       └── settings/
│           ├── general/page.tsx
│           ├── members/page.tsx
│           ├── titles/page.tsx
│           ├── units/page.tsx
│           └── notifications/page.tsx
└── super-admin/
    ├── condominiums/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/page.tsx
    └── audit-log/page.tsx
```

---

## Database Schema (High-Level)

```sql
condominiums          (id, name, logo_url, address, description, slug, created_at)
condominium_members   (id, condominium_id, user_id, system_role, functional_title_id, joined_at)
functional_titles     (id, condominium_id, name, sort_order)
units                 (id, condominium_id, unit_number, floor, area_m2, ownership_share_pct)
unit_owners           (id, unit_id, user_id nullable, owner_name, owner_email)
budget_plans          (id, condominium_id, year, status draft|published, published_at)
budget_line_items     (id, budget_plan_id, category, amount, notes)
projects              (id, condominium_id, title, description, category, status, estimated_cost, actual_cost, start_date, end_date, responsible_person, created_by)
project_updates       (id, project_id, body, created_by, created_at)
initiatives           (id, condominium_id, title, description, category, status, submitter_id, admin_notes, created_at)
ballots               (id, condominium_id, title, description, question_type, options jsonb, open_at, close_at, quorum_pct, linked_initiative_id, status, created_by)
votes                 (id, ballot_id, voter_id, selected_options jsonb, voted_at)
documents             (id, condominium_id, folder_id nullable, name, storage_path, visibility_override nullable, uploaded_by, created_at)
document_folders      (id, condominium_id, parent_folder_id nullable, name, default_visibility)
announcements         (id, condominium_id, title, body, pinned, published_at, created_by)
maintenance_requests  (id, condominium_id, submitter_id, title, description, category, location, priority, status, admin_notes, created_at)
notifications         (id, user_id, condominium_id, type, title, body, read, link_url, created_at)
audit_logs            (id, condominium_id, actor_id, action, entity_type, entity_id, metadata jsonb, created_at)
```

---

## Supabase Storage Buckets

- `documents` — condominium documents (RLS + signed URLs)
- `avatars` — user profile photos
- `initiative-attachments` — files attached to initiatives
- `maintenance-attachments` — photos for maintenance requests
- `announcement-attachments` — files attached to announcements

---

## Key Conventions

- **Routing:** `app/app/[condominiumSlug]/...` for tenant pages, `app/super-admin/...` for platform admin
- **Auth:** Supabase Auth; middleware protects all `/app/*` and `/super-admin/*` routes
- **Multi-tenancy:** All data tables have `condominium_id`; RLS enforces isolation at DB level
- **Roles:** `super-admin` (platform-wide) | `admin` (per-condo) | `user` (per-condo)
- **Functional titles:** Display-only governance labels, do NOT change system permissions
- **Branch naming:** `claude/feature-<slug>` (e.g. `claude/feature-authentication`)
- **Feature files:** Each feature has a file at `features/F<NN>-<name>.md` with full task list

---

## Supabase Migrations Workflow

SQL migrations live in `supabase/migrations/` and are numbered `YYYYMMDDNNNNNN_name.sql`.

**How to apply them to your Supabase project (two options):**

**Option A — Supabase CLI (recommended):**
```bash
supabase db push
```
This applies all pending migrations in order. Run once after pulling a branch with new migration files.

**Option B — Supabase Dashboard:**
Open the SQL editor in your Supabase project dashboard and paste + run each migration file manually in order.

**Convention for Claude sessions:**
- I write migration files as part of each feature and check them into the repo
- After a feature branch is merged, you run `supabase db push` (or apply manually) once
- I will always list which migration files were added in the feature's task file and in the PR description
- I never apply migrations to your live Supabase project directly — that is always your step

---

## Safety Rules (MUST follow)

### Before every push
1. **Run `npx next build`** — the branch must compile cleanly. Never push code that fails the build.
2. **Check for conflict markers** — run `grep -rn "<<<<<<" --include="*.ts" --include="*.tsx" --include="*.md"` before committing after any merge/rebase. Leftover `<<<<<<<` / `>>>>>>>` markers break builds and corrupt files.
3. **Verify no files were accidentally deleted** — after resolving merge conflicts, run `git diff --stat HEAD origin/main` and review any deleted files. If a file exists on `main` and your branch deletes it, confirm the deletion is intentional.

### When resolving merge conflicts
- **Never auto-accept "ours" or "theirs" for an entire file.** Review each conflict block individually.
- After resolving, run `npx next build` to catch duplicate exports, missing imports, or broken references.
- Pay special attention to `app/` pages — accidentally dropping a page file creates 404s for users.

### Do NOT rename or delete framework files without verifying
- **`middleware.ts`** — Next.js 16 shows a deprecation warning suggesting `proxy.ts`. Both conventions work, but do NOT rename unless the team explicitly decides to migrate. If you do rename, update `lib/supabase/middleware.ts` references and all docs.
- Do not remove packages (`package.json` dependencies) that are used in the codebase. Search for imports before removing.
- Do not revert completed feature statuses in `CLAUDE.md` or feature files — check the Features Progress table first.

### Keep docs in sync
- When changing the auth method, update: `CLAUDE.md` Tech Stack table, `features/F02-authentication.md`, and the Session Log.
- When adding/removing pages or lib files, update the Repo Map in `CLAUDE.md`.
- When adding migrations, list them in the relevant feature file under a "Database Migrations" section.
- **Feature status must always be identical in both places.** When marking a feature complete, update `Status:` in `features/F<NN>-*.md` AND the Features Progress table in this file in the same commit. Never let them diverge.

---

## Feature Branch Workflow

1. When starting a new feature, create branch: `git checkout -b claude/feature-<slug>`
2. Read the relevant feature file in `features/` for task list and context pointers
3. Update status in **both** `features/F<NN>-*.md` (the `Status:` field at the top) **and** the Features Progress table in this file — always in the same commit
4. Run `npx next build` before pushing — never push a broken build
5. Push feature branch when all tasks are done

---

## Merge to Main Workflow

**Never merge to main without explicit user confirmation.**

When a feature branch is complete:
1. Post a summary of everything implemented on the branch
2. Ask the user: *"Ready to merge `claude/feature-<name>` into `main`? Confirm and I'll pull, merge, and push."*
3. Only after the user confirms, run:
   ```bash
   git checkout main
   git pull origin main
   git merge claude/feature-<name> --no-ff -m "Merge feature: <name>"
   git push origin main
   ```
4. **After merge, verify:** run `npx next build` on `main` to catch any merge issues
5. Update the Features Progress table in this file: set status to `completed`, clear branch
6. Log the merge in the Session Log below

---

## Features Progress

| ID | Feature | Status | Branch |
|---|---|---|---|
| F01 | Project Foundation & Setup | `completed` | `claude/build-pending-feature-2x0EO` |
| F02 | Authentication | `completed` | `claude/build-authentication-I46RN` |
| F03 | Multi-tenancy & Condominium Workspace | `completed` | `claude/build-multitenancy-condominium-sVQC8` |
| F04 | User Roles & Members Management | `completed` | `claude/feature-user-roles-members` |
| F05 | Dashboard / Home Page | `completed` | `claude/build-fifth-feature-F8aWs` |
| F06 | Yearly Budget Plan | `completed` | `claude/build-yearly-budget-plan-nypk2` |
| F07 | Projects | `completed` | `claude/build-projects-feature-Gbgrv` |
| F08 | Condominium Administration Page | `completed` | `claude/build-condo-admin-page-9Fjc5` |
| F09 | Initiatives | `completed` | `claude/build-initiatives-feature-780sD` |
| F10 | Ballots & Voting | `completed` | `claude/build-ballots-voting-5PEV8` |
| F11 | Document Repository | `completed` | `claude/build-feature-docs-1xnTb` |
| F12 | Announcements | `completed` | `claude/build-announcements-feature-rbxuB` |
| F13 | Maintenance Requests | `completed` | `claude/build-maintenance-requests-VnTco` |
| F14 | Units & Ownership | `completed` | `claude/build-units-ownership-feature-qUMFU` |
| F15 | Notifications (In-App + Email) | `completed` | `claude/build-notifications-feature-NHD0B` |
| F16 | Audit Log | `completed` | `claude/build-audit-log-feature-Q6L7e` |
| F17 | Super Admin Panel | `completed` | `claude/build-super-admin-panel-INiZo` |
| F18 | Settings Pages | `pending` | — |

---

## Session Log

| Date | Action |
|---|---|
| 2026-02-28 | Initial CLAUDE.md created; all feature files scaffolded |
| 2026-02-28 | Reorganized repo: spec moved to `docs/`; merge-to-main workflow added |
| 2026-02-28 | `claude/setup-project-structure-xDH6H` merged into `main` via PR (manually by user) |
| 2026-02-28 | F01 Project Foundation completed on `claude/build-pending-feature-2x0EO`: Supabase clients, shadcn/ui components, middleware, TypeScript DB types, shell layouts |
| 2026-02-28 | F02 Authentication completed on `claude/build-authentication-I46RN`: login page, auth callback, confirm page, pending page, invite acceptance flow, middleware redirect logic, invitations DB migration |
| 2026-02-28 | F02 follow-up: base schema migration added, TS type fix for invitations query, middleware guard fix; merged to main via PRs |
| 2026-02-28 | Auth switched from magic link to Google OAuth (PRs #11, #12); privacy/terms pages added |
| 2026-02-28 | Added Supabase Migrations Workflow section to CLAUDE.md |
| 2026-02-28 | F03 Multi-tenancy & Condominium Workspace completed on `claude/build-multitenancy-condominium-sVQC8`: condominium slug routing, tenant layout, RLS migrations, helper functions (`is_super_admin`, `is_admin`, `get_my_condominium_id`), functional titles seed trigger |
| 2026-02-28 | PRs #13 and #14 fixed (middleware rename bug, missing privacy/terms pages, stale docs) and merged to main |
| 2026-02-28 | F04 User Roles & Members Management started on `claude/feature-user-roles-members`: admin guards, members page, invite form, pending invitations, functional titles CRUD, profiles migration |
| 2026-02-28 | F05 Dashboard / Home Page started on `claude/build-fifth-feature-F8aWs`: NavCard component, ActivityFeed component, full dashboard page (condominium header, 8-card nav grid, recent activity), slug-root redirect, condominium picker page, middleware multi-membership redirect |
| 2026-02-28 | Fix: middleware post-login redirect now checks super-admin role first and routes to `/super-admin/condominiums`, preventing super-admins with no memberships from landing on `/pending` |
| 2026-02-28 | F06 Yearly Budget Plan completed on `claude/build-yearly-budget-plan-nypk2`: migration for budget_plans + budget_line_items with RLS, read view with year selector, admin-only editor with inline add/remove/reorder, publish confirmation dialog, server actions |
| 2026-02-28 | F17 Super Admin Panel completed on `claude/build-super-admin-panel-INiZo`: condominiums list+search, create/edit/suspend/reactivate/delete condominiums, member management, invite admin, audit log page, /suspended page, middleware suspended-check, migration for condominiums.status + audit_logs + profiles RLS |
| 2026-02-28 | Hotfix on main: added error boundaries (`global-error.tsx`, `super-admin/error.tsx`), env var validation in `createServiceClient`, `.env.local` created for local dev. Root cause: missing `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars |
| 2026-02-28 | F07 Projects completed on `claude/build-projects-feature-Gbgrv`: migration for projects + project_updates with RLS, projects list with status tabs, project detail with progress updates timeline, create/edit forms (admin), lifecycle status advancement, 6 new components |
| 2026-02-28 | F08 Condominium Administration Page completed on `claude/build-condo-admin-page-9Fjc5`: governance team page, 2 components (GovernanceMemberCard, GovernanceGrid), getGovernanceMembers query, admin "Manage Team" button, empty state |
| 2026-02-28 | F09 Initiatives completed on `claude/build-initiatives-feature-780sD`: migration for initiatives + initiative_attachments with RLS, initiatives list with status tabs, submit form, detail page with admin controls (approve/reject modal/convert), admin review queue, 4 new components, DB types updated |
| 2026-02-28 | F10 Ballots & Voting completed on `claude/build-ballots-voting-5PEV8`: migration for ballots + votes tables with RLS + has_voted() function, ballots list with Open/Upcoming/Closed/Draft tabs, ballot detail with voting interface (yes/no, single, multi-choice), admin tally, lifecycle controls (Draft→Open→Closed→Results Published), results page with quorum assessment, CSV export, 6 new components |
| 2026-02-28 | F11 Document Repository completed on `claude/build-feature-docs-1xnTb`: migration for document_folders + documents tables with RLS + effective_doc_visibility() DB function, root folder list page, folder contents page with breadcrumb + subfolder navigation, signed-URL download route, 8 new components (visibility-badge, folder-card, document-row, folder-manager, folder-content-manager, new-folder-dialog, upload-file-dialog, edit-item-dialog), MIME type + file size validation on upload |
| 2026-02-28 | F12 Announcements completed on `claude/build-announcements-feature-rbxuB`: migration for announcements + announcement_attachments tables with RLS, announcement feed page (pinned at top, sorted by published_at), announcement detail page with body + attachments, admin create/edit forms with multi-file upload, pin/unpin toggle, delete with confirmation, signed-URL attachment download, 6 new components, announcement_attachments DB type added |
| 2026-02-28 | F13 Maintenance Requests completed on `claude/build-maintenance-requests-VnTco`: migration for maintenance_requests + maintenance_attachments tables with RLS + updated_at trigger, requests list with status tab filters (users see own; admins see all), submit form with multi-photo upload, detail page with photo gallery + lightbox, admin controls (status/priority/notes), 6 new components, DB types updated |
| 2026-02-28 | F14 Units & Ownership completed on `claude/build-units-ownership-feature-qUMFU`: migration for units + unit_owners tables with RLS, admin unit register page (table with add/edit/delete/owners), unit-dialog and unit-owners-dialog modals (link registered members or unregistered owners), recalculate shares action, user My Unit page, DB types updated |
| 2026-02-28 | F15 Notifications completed on `claude/build-notifications-feature-NHD0B`: migration for notifications table with RLS + realtime enabled, NotificationBell client component with realtime Supabase subscription + unread badge + dropdown + bell shake animation, full notifications page, useNotifications hook, createNotification/createNotificationForAllMembers helpers, notification triggers wired into announcements/ballots/initiatives/maintenance actions, Supabase Edge Function for n8n webhooks, docs/n8n-webhooks.md payload reference |
| 2026-02-28 | **TODO (F15 follow-up):** n8n email notifications deferred. Edge function exists but not deployed. To activate: (1) `supabase functions deploy trigger-n8n-webhook`, (2) set `N8N_WEBHOOK_BASE_URL` + `N8N_WEBHOOK_SECRET` secrets, (3) add fire-and-forget fetch calls to relevant server actions. See `features/F15-notifications.md` n8n section for full details. |
| 2026-02-28 | F16 Audit Log completed on `claude/build-audit-log-feature-Q6L7e`: `lib/audit/log-action.ts` helper (service-role, error-swallowing), logAction wired into 8 server action files (members, budget, projects, initiatives, ballots, documents, announcements, maintenance), admin-only audit-log page at `settings/audit-log` with filtering (action, actor, entity type, date range) + server-side pagination; no new migration needed (audit_logs table already in F17 migration) |
