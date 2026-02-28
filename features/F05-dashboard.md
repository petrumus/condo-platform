# F05 — Dashboard / Home Page

**Status:** `completed`
**Branch:** `claude/build-fifth-feature-F8aWs`
**Spec sections:** §6.1 Home Page / Dashboard

---

## Context

The dashboard is the landing page for authenticated users in their condominium workspace. It shows navigation cards to all major sections, a recent activity feed, and the notification bell.

**Key files to read before starting:**
- `CLAUDE.md` — repo map, planned route structure
- `features/F03-multitenancy-condominium.md` — condominium context and layout
- `docs/condominium-platform-spec.md` §6.1

---

## Tasks

### Dashboard Page
- [x] Create `app/app/[condominiumSlug]/dashboard/page.tsx`:
  - Display condominium name, logo, and description at the top
  - Navigation card grid (see cards below)
  - Recent activity feed section
  - Server component — fetch data at render time

### Navigation Cards
Each card links to a section and shows a relevant icon + title:
- [x] Yearly Budget Plan → `/budget/[currentYear]`
- [x] Projects → `/projects`
- [x] Administration → `/administration`
- [x] Documents → `/documents`
- [x] Initiatives → `/initiatives`
- [x] Ballots / Voting → `/ballots`
- [x] Maintenance Requests → `/maintenance`
- [x] Announcements → `/announcements`

Create `components/dashboard/nav-card.tsx` — reusable card component with icon, title, description, and link.

### Recent Activity Feed
- [x] Create `components/dashboard/activity-feed.tsx`
- [x] Query and display (server-side):
  - Latest 3 announcements (title + published date)
  - Open ballots (title + close date)
  - Newly approved initiatives (title + approved date)
- [x] Each activity item links to the relevant detail page
- [x] Show "No recent activity" empty state if nothing to show

### Redirect Logic
- [x] Redirect `/app/[condominiumSlug]` → `/app/[condominiumSlug]/dashboard`
- [x] After successful login, redirect to the user's condominium dashboard (if they have exactly one membership)
- [x] If user has multiple memberships, show a condominium picker page at `/app`
- [x] If user is super-admin (no memberships required), redirect to `/super-admin/condominiums`

---

## Definition of Done

- Dashboard renders with condominium info, all 8 nav cards, and recent activity
- All nav cards link to the correct routes
- Activity feed shows real data from the database
- Redirects work correctly after login

---

## Notes

- The notification bell is rendered in the navbar (F03) but wired to real data in F15
- The condominium logo is served from Supabase Storage `avatars` bucket
- Keep dashboard queries lightweight — no heavy joins; use Supabase views if needed
