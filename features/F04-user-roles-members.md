# F04 — User Roles & Members Management

**Status:** `pending`
**Branch:** `claude/feature-user-roles-members`
**Spec sections:** §3 User Roles & Permissions, §5 Invitations

---

## Context

Members management lives under `/settings/members`. Admins can view all members, change their roles, assign functional titles, and invite new users by email. Users can view their own profile but cannot manage others.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `condominium_members`, `functional_titles`
- `features/F02-authentication.md` — invitation flow (builds on it)
- `features/F03-multitenancy-condominium.md` — RLS and role helpers
- `condominium-platform-spec.md` §3

---

## Tasks

### Settings / Members Page
- [ ] Create `app/app/[condominiumSlug]/settings/members/page.tsx`:
  - Admin-only page (redirect non-admins)
  - List all condominium members: name, email, system role, functional title, joined date
  - Actions per member: change system role, assign/remove functional title, remove from condominium
- [ ] Create server actions in `app/app/[condominiumSlug]/settings/members/actions.ts`:
  - `updateMemberRole(memberId, newRole)` — admin only
  - `updateMemberTitle(memberId, titleId | null)` — admin only
  - `removeMember(memberId)` — admin only; cannot remove self

### Invite Flow UI
- [ ] Create invite form component (on the members page): email input + role selector
- [ ] Server action: `inviteMember(email, role)` — creates invitation row, triggers email via Supabase Edge Function or n8n webhook
- [ ] Show pending invitations list with option to revoke

### Functional Titles Management
- [ ] Create `app/app/[condominiumSlug]/settings/titles/page.tsx`:
  - Admin-only page
  - List all titles (built-in + custom) with sort order
  - Create custom title form
  - Edit title name / sort order
  - Delete custom title (cannot delete built-in titles)
- [ ] Server actions in `settings/titles/actions.ts`:
  - `createTitle(name, sortOrder)`
  - `updateTitle(id, name, sortOrder)`
  - `deleteTitle(id)` — admin only, prevent deletion of built-in titles

### Access Control Component
- [ ] Create `components/guards/admin-only.tsx` — server component wrapper that renders children only for admins, otherwise shows 403/redirect
- [ ] Create `components/guards/super-admin-only.tsx` — same for super-admin routes

---

## Definition of Done

- Admin can invite users by email, and the invite appears in the pending list
- Admin can change a member's system role and functional title
- Admin can remove a member
- Custom functional titles can be created, edited, and deleted
- Non-admin users cannot access `/settings/members` or `/settings/titles`

---

## Notes

- Built-in titles (Administrator, Councilor, Auditor, Accountant) are seeded per-condominium and should not be deletable
- `system_role` is stored in `condominium_members.system_role`, NOT in Supabase Auth metadata (except for `super-admin` which is platform-wide)
- When a member is removed, their `condominium_members` row is deleted; their auth account remains
