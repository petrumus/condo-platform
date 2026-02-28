# F08 — Condominium Administration Page

**Status:** `pending`
**Branch:** `claude/feature-administration-page`
**Spec sections:** §6.4 Condominium Administration Page

---

## Context

A public-facing page (visible to all condominium members) listing the people who govern the condominium. Shows each person's name, photo, functional title, and optional contact info. Ordered by title hierarchy. Managed by admins who assign functional titles to existing members.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `condominium_members`, `functional_titles`
- `features/F03-multitenancy-condominium.md` — RLS and condominium context
- `features/F04-user-roles-members.md` — functional titles management
- `condominium-platform-spec.md` §6.4

---

## Tasks

### Administration Page
- [ ] Create `app/app/[condominiumSlug]/administration/page.tsx`:
  - Fetch all members who have a functional title assigned
  - Order by `functional_titles.sort_order` ASC
  - Display as a card grid or list
  - Each card: avatar/photo, full name, functional title name, optional contact info (email or phone if provided)
  - If no governance members are assigned yet, show empty state: "No governance team members assigned yet."

### Components
- [ ] Create `components/administration/governance-member-card.tsx`:
  - Avatar (from Supabase Storage `avatars` bucket, or initials fallback)
  - Full name
  - Functional title badge
  - Optional contact info (email link)
- [ ] Create `components/administration/governance-grid.tsx` — responsive grid of member cards

### Data Access
- [ ] Create server query in `lib/queries/administration.ts`:
  - `getGovernanceMembers(condominiumId)` — joins `condominium_members` → `auth.users` (for name/email) → `functional_titles`, filtered to members with a title, ordered by sort_order
- [ ] Optionally expose a `contact_email_visible` boolean on `condominium_members` to let members opt-in to showing their email publicly within the condominium

### Admin Controls
- [ ] Admin sees an "Manage Team" button linking to `/settings/members`
- [ ] On the members settings page (F04), the functional title assignment updates which members appear here

---

## Definition of Done

- Page displays all members with functional titles, ordered by title hierarchy
- Avatar shows profile photo or initials fallback
- Admin can navigate to settings to manage who appears on this page
- Empty state shown when no titles are assigned

---

## Notes

- This page does NOT have its own admin editor — it is driven entirely by the `functional_titles` assignment in the members settings (F04)
- Built-in title sort order: President=1, Administrator=2, Councilor=3, Auditor=4, Accountant=5, custom=10+
- Contact info display is opt-in to respect privacy
