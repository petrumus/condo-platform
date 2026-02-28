# F02 — Authentication

**Status:** `completed`
**Branch:** `claude/build-authentication-I46RN`
**Spec sections:** §5 Authentication, §9 Edge Functions

---

## Context

Authentication is handled entirely by Supabase Auth using Google OAuth. After first sign-in, users are in a "pending" state until an admin adds them to a condominium and assigns a role.

**Key files to read before starting:**
- `CLAUDE.md` — repo map and conventions
- `features/F01-project-foundation.md` — must be completed first (Supabase client setup)
- `docs/condominium-platform-spec.md` §5 — auth details

---

## Tasks

### Pages & UI
- [x] Create `app/page.tsx` — marketing/login landing page with sign-in form (email input)
- [x] Create `app/auth/login/page.tsx` — dedicated login page if needed (or combine with root)
- [x] Create `app/auth/callback/route.ts` — handle Supabase email magic link / OAuth callback, exchange code for session
- [x] Create `app/auth/confirm/page.tsx` — "Check your email" confirmation page shown after magic link sent
- [x] Create `app/pending/page.tsx` — page shown to authenticated users who are not yet members of any condominium

### Auth Logic
- [x] Implement `signInWithGoogle` (Google OAuth) action in `app/auth/actions.ts`
- [x] Implement `signOut` server action
- [x] Add post-signup hook: after a new user confirms email, create their profile record if one doesn't exist
- [x] Create `lib/auth/get-user.ts` — helper to get current user server-side (used in server components and route handlers)
- [x] Create `lib/auth/get-membership.ts` — helper to get user's membership for a given condominium (role, titles)

### Middleware & Guards
- [x] Update `middleware.ts` (from F01) to:
  - Redirect `/app/*` → `/` if not authenticated
  - Redirect `/super-admin/*` → `/` if not `super-admin` role
  - Redirect `/` → `/app/[slug]/dashboard` if authenticated and has a condominium membership
  - Redirect authenticated users with no membership → `/pending`

### Invitation Flow
- [x] Create DB migration: `invitations` table (id, condominium_id, email, role, token, accepted_at, created_by, created_at)
- [x] Create `app/invite/[token]/page.tsx` — invitation acceptance page
- [x] Supabase Edge Function (or server action): send invitation email with unique token link
- [x] Server action: accept invitation — creates `condominium_members` row, marks invitation accepted

### Database Migrations (applied to Supabase)
- [x] `supabase/migrations/20260228000000_base_schema.sql` — condominiums, functional_titles, condominium_members tables + RLS
- [x] `supabase/migrations/20260228000001_invitations.sql` — invitations table + RLS

---

## Definition of Done

- User can sign in via Google OAuth
- Unauthenticated users cannot access `/app/*` or `/super-admin/*`
- New users without a condominium membership see the `/pending` page
- Invited users can accept invitations and are added to the correct condominium with the correct role

---

## Notes

- Use Supabase Auth `signInWithOAuth` with `provider: "google"`
- Google OAuth must be enabled in the Supabase dashboard (Authentication → Providers → Google) with Client ID and Secret from Google Cloud Console
- The callback URL to register in Google Cloud Console: `https://<your-project>.supabase.co/auth/v1/callback`
- The invitation flow is separate from the Google OAuth flow — invitation tokens are custom rows in the DB; after OAuth, users are redirected back to the invite page via the `next` query param
- `super-admin` role will be stored in Supabase Auth user metadata or a separate `platform_roles` table (decide during implementation)
