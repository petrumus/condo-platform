# F03 — Multi-tenancy & Condominium Workspace

**Status:** `completed`
**Branch:** `claude/build-multitenancy-condominium-sVQC8`
**Spec sections:** §4 Multi-Tenancy Architecture, §7 Data Model, §9 RLS

---

## Context

Every tenant workspace is a row in the `condominiums` table. All other tables reference `condominium_id`. Supabase RLS enforces data isolation so users only ever see data from their own condominium. The URL slug (`/app/[condominiumSlug]/...`) identifies which workspace is active.

**Key files to read before starting:**
- `CLAUDE.md` — full database schema
- `features/F01-project-foundation.md` — Supabase client setup
- `features/F02-authentication.md` — auth and membership helpers
- `docs/condominium-platform-spec.md` §4, §7, §9

---

## Tasks

### Database Migrations
- [x] Create migration: `condominiums` table (`20260228000000_base_schema.sql`)
- [x] Create migration: `condominium_members` table (`20260228000000_base_schema.sql`)
- [x] Create migration: `functional_titles` table (`20260228000000_base_schema.sql`)
- [x] Seed built-in functional titles: Administrator, Councilor, Auditor, Accountant

### RLS Policies
- [x] `condominiums`: SELECT for members only (via join to `condominium_members`)
- [x] `condominium_members`: SELECT for members of same condominium; INSERT/UPDATE/DELETE for admin only
- [x] `functional_titles`: SELECT for members; INSERT/UPDATE/DELETE for admin only
- [x] Create Postgres function `get_my_condominium_id(slug text)` — helper used in RLS policies (`20260228000002_condominium_helpers.sql`)
- [x] Create Postgres function `is_admin(condominium_id uuid)` — checks if current user is admin for given condo (`20260228000002_condominium_helpers.sql`)
- [x] Create Postgres function `is_super_admin()` — checks platform-level role from auth metadata (`20260228000002_condominium_helpers.sql`)

### App Layout & Context
- [x] Create `app/app/[condominiumSlug]/layout.tsx`:
  - Fetch condominium data by slug (server component)
  - 404 if not found or user is not a member
  - Pass condominium data via React context or layout props
- [x] Create `lib/context/condominium-context.tsx` — React context providing current condominium data to client components
- [x] Create `components/layout/navbar.tsx` — top navigation bar with:
  - Condominium name/logo
  - Navigation links (dashboard, budget, projects, etc.)
  - Notification bell placeholder (wired in F15)
  - User menu (profile, sign out)

### Utility Helpers
- [x] Create `lib/condominium/get-condominium.ts` — server-side fetch of condominium by slug
- [x] Create `lib/condominium/get-user-role.ts` — get current user's `system_role` for a condominium

---

## Definition of Done

- Navigating to `/app/unknown-slug/dashboard` returns 404
- Navigating to a valid slug renders the layout with condominium name in navbar
- RLS prevents users from querying data of other condominiums (verified via SQL tests or Supabase dashboard)
- `is_admin()` and `is_super_admin()` Postgres helpers work correctly

---

## Notes

- The `slug` field on `condominiums` must be URL-safe (lowercase, hyphens only)
- RLS should be enabled on ALL tables before any data is inserted
- `functional_titles` has built-in entries per-condominium (created when a condominium is created) plus custom ones admins can add
