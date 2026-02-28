# F17 — Super Admin Panel

**Status:** `pending`
**Branch:** `claude/feature-super-admin-panel`
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
- [ ] Create `app/super-admin/layout.tsx`:
  - Verifies `is_super_admin()` on every render; redirects to `/` if not
  - Top navigation: Condominiums, Audit Log, back to platform home
- [ ] Middleware already handles super-admin route protection (from F01/F02)

### Condominium List Page
- [ ] Create `app/super-admin/condominiums/page.tsx`:
  - Table of all condominiums: name, slug, admin count, member count, status (active/suspended), created_at
  - Search by name
  - "Create Condominium" button
  - Per-row actions: View, Suspend/Reactivate, Delete

### Create Condominium
- [ ] Create `app/super-admin/condominiums/new/page.tsx`:
  - Form: name, slug (auto-generated from name, editable), address, description, logo upload
  - On create: inserts `condominiums` row, seeds built-in functional titles
- [ ] Server action: `createCondominium(data, logo?)` — creates condominium, seeds titles, creates initial admin member record if email provided

### Condominium Detail Page
- [ ] Create `app/super-admin/condominiums/[id]/page.tsx`:
  - Condominium details (name, slug, address, logo, description)
  - Edit button (inline or separate edit page)
  - Member list: all members with their roles
  - Admin management: assign/remove admin role to existing members
  - Invite new admin by email
  - Danger zone: Suspend / Delete condominium

### Condominium Status Management
- [ ] Add `status ('active'|'suspended')` field to `condominiums` table
- [ ] Server action: `suspendCondominium(id)` — sets status to 'suspended'
- [ ] Server action: `reactivateCondominium(id)` — sets status to 'active'
- [ ] Server action: `deleteCondominium(id)` — hard delete (with confirmation; cascades via FK)
- [ ] Middleware: redirect condominium members to a "suspended" page if their condo is suspended

### Super Admin Audit Log
- [ ] Create `app/super-admin/audit-log/page.tsx`:
  - Reuse `audit-log-table` component from F16
  - Show condominium filter column and filter dropdown
  - Date range + actor + entity type filters

### Assign Super-Admin Role
- [ ] Super-admin can grant super-admin role to other users via Supabase Auth admin API
- [ ] Create `app/super-admin/admins/page.tsx` — list of all super-admins (optional, but useful)

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
