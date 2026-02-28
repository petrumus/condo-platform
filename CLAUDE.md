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
| Auth | Supabase Auth — Email |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Workflow Automation | n8n (email notifications, scheduled jobs) |
| Hosting | Vercel (frontend) + Hetzner (n8n) |

---

## Repo Map

```
/
├── CLAUDE.md                        ← This file (project guide & progress tracker)
├── docs/
│   ├── condominium-platform-spec.md ← Full product specification
│   └── n8n-webhooks.md              ← n8n webhook payload reference (added in F15)
├── features/                        ← Feature task files (one per feature)
│   ├── F01-project-foundation.md
│   ├── F02-authentication.md
│   ├── F03-multitenancy-condominium.md
│   ├── F04-user-roles-members.md
│   ├── F05-dashboard.md
│   ├── F06-budget-plan.md
│   ├── F07-projects.md
│   ├── F08-administration-page.md
│   ├── F09-initiatives.md
│   ├── F10-ballots-voting.md
│   ├── F11-document-repository.md
│   ├── F12-announcements.md
│   ├── F13-maintenance-requests.md
│   ├── F14-units-ownership.md
│   ├── F15-notifications.md
│   ├── F16-audit-log.md
│   ├── F17-super-admin-panel.md
│   └── F18-settings-pages.md
├── app/                             ← Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                     ← Marketing / login page (root)
│   ├── globals.css
│   └── favicon.ico
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

## Feature Branch Workflow

1. When starting a new feature, create branch: `git checkout -b claude/feature-<slug>`
2. Read the relevant feature file in `features/` for task list and context pointers
3. Update status in this CLAUDE.md (below) when started and completed
4. Push feature branch when all tasks are done

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
4. Update the Features Progress table in this file: set status to `completed`, clear branch
5. Log the merge in the Session Log below

---

## Features Progress

| ID | Feature | Status | Branch |
|---|---|---|---|
| F01 | Project Foundation & Setup | `completed` | `claude/build-pending-feature-2x0EO` |
| F02 | Authentication | `completed` | `claude/build-authentication-I46RN` |
| F03 | Multi-tenancy & Condominium Workspace | `completed` | `claude/build-multitenancy-condominium-sVQC8` |
| F04 | User Roles & Members Management | `pending` | — |
| F05 | Dashboard / Home Page | `pending` | — |
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
| 2026-02-28 | F02 Authentication completed on `claude/build-authentication-I46RN`: magic link login page, auth callback, confirm page, pending page, invite acceptance flow, middleware redirect logic, invitations DB migration |
| 2026-02-28 | F03 Multi-tenancy & Condominium Workspace completed on `claude/build-multitenancy-condominium-sVQC8`: condominium slug routing, tenant layout, RLS migrations, helper functions (`is_super_admin`, `is_admin`, `get_my_condominium_id`), functional titles seed trigger |
