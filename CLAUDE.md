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
│   └── 20260228000003_profiles.sql      ← profiles table + sync trigger (F04)
├── app/                             ← Next.js App Router
│   ├── layout.tsx                   ← Root layout (Geist fonts, Analytics)
│   ├── page.tsx                     ← Login page (Google OAuth)
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
│   ├── invite/[token]/
│   │   ├── page.tsx                 ← Invitation acceptance page
│   │   └── actions.ts               ← Accept invitation server action
│   ├── pending/page.tsx             ← No-membership landing page
│   ├── privacy/page.tsx             ← Privacy policy
│   ├── terms/page.tsx               ← Terms of service
│   └── super-admin/layout.tsx       ← Super-admin shell layout
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
│   ├── types/index.ts               ← Shared type exports
│   └── utils.ts                     ← cn() and other utilities
├── components/
│   ├── logo.tsx                     ← SVG logo component
│   ├── layout/navbar.tsx            ← Top navigation bar
│   ├── dashboard/
│   │   ├── nav-card.tsx             ← Navigation card (icon + title + description)
│   │   └── activity-feed.tsx        ← Recent activity feed (announcements, ballots, initiatives)
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

---

## Feature Branch Workflow

1. When starting a new feature, create branch: `git checkout -b claude/feature-<slug>`
2. Read the relevant feature file in `features/` for task list and context pointers
3. Update status in this CLAUDE.md (below) when started and completed
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
| F06 | Yearly Budget Plan | `pending` | — |
| F07 | Projects | `pending` | — |
| F08 | Condominium Administration Page | `pending` | — |
| F09 | Initiatives | `pending` | — |
| F10 | Ballots & Voting | `pending` | — |
| F11 | Document Repository | `pending` | — |
| F12 | Announcements | `pending` | — |
| F13 | Maintenance Requests | `pending` | — |
| F14 | Units & Ownership | `pending` | — |
| F15 | Notifications (In-App + Email) | `pending` | — |
| F16 | Audit Log | `pending` | — |
| F17 | Super Admin Panel | `pending` | — |
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
