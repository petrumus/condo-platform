# F17 — Super Admin Panel

**Status:** `completed`
**Branch:** `claude/build-super-admin-panel-INiZo`
**Spec sections:** §3.1 super-admin role, §13 Routes (/super-admin/*)

---

## Context

Super-admins have platform-wide access. They manage condominium workspaces (create, suspend, delete), manage admin assignments across condominiums, and view the platform-wide audit log. The super-admin panel is at `/super-admin/*` and is protected from all non-super-admin users.

**Key files to read before starting:**
- `CLAUDE.md` — repo map, schema overview
- `features/F02-authentication.md` — super-admin role in auth metadata
- `features/F03-multitenancy-condominium.md` — condominiums table, is_super_admin()
- `features/F16-audit-log.md` — platform-wide audit log view
- `docs/condominium-platform-spec.md` §3.1, §13

---

## Tasks

### Layout & Guard
- [x] Updated `app/super-admin/layout.tsx` with nav links (Condominiums, Audit Log)
- [x] Middleware handles super-admin route protection (from F01/F02)

### Condominium List Page
- [x] Created `app/super-admin/condominiums/page.tsx`: table with name, slug, status, admin/member counts, search, Create button, per-row actions
- [x] Created `app/super-admin/condominiums/condominium-row-actions.tsx`: View, Suspend/Reactivate, Delete (with typed-name confirmation dialog)

### Create Condominium
- [x] Created `app/super-admin/condominiums/new/page.tsx`
- [x] Created `app/super-admin/condominiums/new/create-condominium-form.tsx`: slug auto-generated from name, editable
- [x] Server action: `createCondominium` — creates condominium row (functional titles seeded via DB trigger)

### Condominium Detail Page
- [x] Created `app/super-admin/condominiums/[id]/page.tsx`: details, member list, invite admin, pending invitations, danger zone
- [x] Created `app/super-admin/condominiums/[id]/edit-condominium-form.tsx`
- [x] Created `app/super-admin/condominiums/[id]/invite-admin-form.tsx`
- [x] Created `app/super-admin/condominiums/[id]/member-row.tsx`: role change, remove member
- [x] Created `app/super-admin/condominiums/[id]/danger-zone.tsx`: suspend/reactivate/delete

### Condominium Status Management
- [x] Migration adds `status ('active'|'suspended')` to `condominiums` table
- [x] Server actions: `suspendCondominium`, `reactivateCondominium`, `deleteCondominium`
- [x] Created `app/suspended/page.tsx` — shown when a suspended condominium is accessed
- [x] Middleware redirects members of suspended condominiums to `/suspended`

### Super Admin Audit Log
- [x] Created `app/super-admin/audit-log/page.tsx`: filterable table (condominium, action, date range), actor names from profiles

### Assign Super-Admin Role
- [ ] Skipped — requires service role key; out of scope for this feature

---

## Database Migrations

- `supabase/migrations/20260228000005_super_admin.sql`
  - Adds `status` column to `condominiums` table
  - Creates `audit_logs` table with RLS policies
  - Adds super-admin bypass policy for `profiles`

---

## Definition of Done

- Super-admin can create, view, edit, suspend, and delete condominiums
- Super-admin can manage admin assignments within any condominium
- Platform-wide audit log is accessible and filterable
- Non-super-admin users are blocked from all `/super-admin/*` routes
- Suspended condominiums show a suspension page to their members

---

## Notes

- `super-admin` role is stored in Supabase Auth user metadata: `{ platform_role: 'super-admin' }` — set via Supabase Admin API (service role)
- `is_super_admin()` Postgres function reads from `auth.users.raw_user_meta_data->>'platform_role'`
- Deleting a condominium is destructive and cascades — require typed confirmation (e.g. "Type the condominium name to confirm")
- The slug must be globally unique across all condominiums
