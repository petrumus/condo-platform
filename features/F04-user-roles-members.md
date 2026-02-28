# F04 — User Roles & Members Management

**Status:** `completed`
**Branch:** `claude/feature-user-roles-members`
**Spec sections:** §3 User Roles & Permissions, §5 Invitations

---

## Context

Members management lives under `/settings/members`. Admins can view all members, change their roles, assign functional titles, and invite new users by email. Users can view their own profile but cannot manage others.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `condominium_members`, `functional_titles`
- `features/F02-authentication.md` — invitation flow (builds on it)
- `features/F03-multitenancy-condominium.md` — RLS and role helpers
- `docs/condominium-platform-spec.md` §3

---

## Tasks

### Settings / Members Page
- [x] Create `app/app/[condominiumSlug]/settings/members/page.tsx`:
  - Admin-only page (redirect non-admins)
  - List all condominium members: name, email, system role, functional title, joined date
  - Actions per member: change system role, assign/remove functional title, remove from condominium
- [x] Create server actions in `app/app/[condominiumSlug]/settings/members/actions.ts`:
  - `updateMemberRole(memberId, newRole)` — admin only
  - `updateMemberTitle(memberId, titleId | null)` — admin only
  - `removeMember(memberId)` — admin only; cannot remove self

### Invite Flow UI
- [x] Create invite form component (on the members page): email input + role selector
- [x] Server action: `inviteMember(email, role)` — creates invitation row
- [x] Show pending invitations list with option to revoke

### Functional Titles Management
- [x] Create `app/app/[condominiumSlug]/settings/titles/page.tsx`:
  - Admin-only page
  - List all titles (built-in + custom) with sort order
  - Create custom title form
  - Edit title name / sort order
  - Delete custom title (cannot delete built-in titles)
- [x] Server actions in `settings/titles/actions.ts`:
  - `createTitle(name, sortOrder)`
  - `updateTitle(id, name, sortOrder)`
  - `deleteTitle(id)` — admin only, prevent deletion of built-in titles

### Access Control Component
- [x] Create `components/guards/admin-only.tsx` — server component wrapper that renders children only for admins, otherwise redirects
- [x] Create `components/guards/super-admin-only.tsx` — same for super-admin routes

---

## Database Migrations

- `supabase/migrations/20260228000003_profiles.sql` — `profiles` table (public mirror of auth.users), RLS policies, sync trigger, backfill

---

## Definition of Done

- Admin can invite users by email, and the invite appears in the pending list ✅
- Admin can change a member's system role and functional title ✅
- Admin can remove a member ✅
- Custom functional titles can be created, edited, and deleted ✅
- Non-admin users cannot access `/settings/members` or `/settings/titles` ✅

---

## Notes

- Built-in titles (Administrator, Councilor, Auditor, Accountant) are seeded per-condominium and should not be deletable
- `system_role` is stored in `condominium_members.system_role`, NOT in Supabase Auth metadata (except for `super-admin` which is platform-wide)
- When a member is removed, their `condominium_members` row is deleted; their auth account remains
- `profiles` table is a public mirror of `auth.users` populated by a trigger on insert/update; allows member data joins without direct auth schema access
