# F02 — Authentication

**Status:** `pending`
**Branch:** `claude/feature-authentication`
**Spec sections:** §5 Authentication, §9 Edge Functions

---

## Context

Authentication is handled entirely by Supabase Auth using Email (magic link or password). After first sign-in, users are in a "pending" state until an admin adds them to a condominium and assigns a role.

**Key files to read before starting:**
- `CLAUDE.md` — repo map and conventions
- `features/F01-project-foundation.md` — must be completed first (Supabase client setup)
- `condominium-platform-spec.md` §5 — auth details

---

## Tasks

### Pages & UI
- [ ] Create `app/page.tsx` — marketing/login landing page with sign-in form (email input)
- [ ] Create `app/auth/login/page.tsx` — dedicated login page if needed (or combine with root)
- [ ] Create `app/auth/callback/route.ts` — handle Supabase email magic link / OAuth callback, exchange code for session
- [ ] Create `app/auth/confirm/page.tsx` — "Check your email" confirmation page shown after magic link sent
- [ ] Create `app/pending/page.tsx` — page shown to authenticated users who are not yet members of any condominium

### Auth Logic
- [ ] Implement `signInWithOtp` (magic link) action in `app/auth/actions.ts`
- [ ] Implement `signOut` server action
- [ ] Add post-signup hook: after a new user confirms email, create their profile record if one doesn't exist
- [ ] Create `lib/auth/get-user.ts` — helper to get current user server-side (used in server components and route handlers)
- [ ] Create `lib/auth/get-membership.ts` — helper to get user's membership for a given condominium (role, titles)

### Middleware & Guards
- [ ] Update `middleware.ts` (from F01) to:
  - Redirect `/app/*` → `/` if not authenticated
  - Redirect `/super-admin/*` → `/` if not `super-admin` role
  - Redirect `/` → `/app/[slug]/dashboard` if authenticated and has a condominium membership
  - Redirect authenticated users with no membership → `/pending`

### Invitation Flow
- [ ] Create DB table migration: `invitations` (id, condominium_id, email, role, token, accepted_at, created_by, created_at)
- [ ] Create `app/invite/[token]/page.tsx` — invitation acceptance page
- [ ] Supabase Edge Function (or server action): send invitation email with unique token link
- [ ] Server action: accept invitation — creates `condominium_members` row, marks invitation accepted

---

## Definition of Done

- User can sign in via magic link email
- Unauthenticated users cannot access `/app/*` or `/super-admin/*`
- New users without a condominium membership see the `/pending` page
- Invited users can accept invitations and are added to the correct condominium with the correct role

---

## Notes

- Use Supabase Auth `signInWithOtp` with `shouldCreateUser: true`
- Email templates for magic link are configured in Supabase dashboard (not in code)
- The invitation flow is separate from the magic link auth flow — invitation tokens are custom rows in the DB
- `super-admin` role will be stored in Supabase Auth user metadata or a separate `platform_roles` table (decide during implementation)
