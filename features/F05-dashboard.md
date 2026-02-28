# F05 — Dashboard / Home Page

**Status:** `pending`
**Branch:** `claude/feature-dashboard`
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
- [ ] Create `app/app/[condominiumSlug]/dashboard/page.tsx`:
  - Display condominium name, logo, and description at the top
  - Navigation card grid (see cards below)
  - Recent activity feed section
  - Server component — fetch data at render time

### Navigation Cards
Each card links to a section and shows a relevant icon + title:
- [ ] Yearly Budget Plan → `/budget/[currentYear]`
- [ ] Projects → `/projects`
- [ ] Administration → `/administration`
- [ ] Documents → `/documents`
- [ ] Initiatives → `/initiatives`
- [ ] Ballots / Voting → `/ballots`
- [ ] Maintenance Requests → `/maintenance`
- [ ] Announcements → `/announcements`

Create `components/dashboard/nav-card.tsx` — reusable card component with icon, title, description, and link.

### Recent Activity Feed
- [ ] Create `components/dashboard/activity-feed.tsx`
- [ ] Query and display (server-side):
  - Latest 3 announcements (title + published date)
  - Open ballots (title + close date)
  - Newly approved initiatives (title + approved date)
- [ ] Each activity item links to the relevant detail page
- [ ] Show "No recent activity" empty state if nothing to show

### Redirect Logic
- [ ] Redirect `/app/[condominiumSlug]` → `/app/[condominiumSlug]/dashboard`
- [ ] After successful login, redirect to the user's condominium dashboard (if they have exactly one membership)
- [ ] If user has multiple memberships, show a condominium picker page at `/app`

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
