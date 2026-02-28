# F01 — Project Foundation & Setup

**Status:** `pending`
**Branch:** `claude/feature-project-foundation`
**Spec sections:** §8 Tech Stack, §9 Supabase Architecture

---

## Context

Before any feature can be built, the project needs its core dependencies installed and configured. This is the foundational layer everything else builds on.

**Key files to read before starting:**
- `CLAUDE.md` — repo map and conventions
- `package.json` — current dependencies
- `condominium-platform-spec.md` §8, §9 — tech stack and Supabase architecture details

---

## Tasks

- [ ] Install Supabase JS client: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Install and configure shadcn/ui (`npx shadcn@latest init`)
- [ ] Install common shadcn components: Button, Card, Input, Label, Select, Badge, Dialog, DropdownMenu, Table, Tabs, Textarea, Avatar, Separator, Skeleton
- [ ] Create `lib/supabase/client.ts` — browser Supabase client (using `createBrowserClient`)
- [ ] Create `lib/supabase/server.ts` — server Supabase client (using `createServerClient` with cookies)
- [ ] Create `lib/supabase/middleware.ts` — session refresh helper for Next.js middleware
- [ ] Create `middleware.ts` at project root — protect `/app/*` and `/super-admin/*` routes; redirect unauthenticated users to `/`
- [ ] Set up `.env.local` template (`.env.local.example`) with required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Create `lib/types/database.ts` — TypeScript types matching the full database schema (tables listed in CLAUDE.md)
- [ ] Create `lib/types/index.ts` — re-exports and domain types (e.g. `SystemRole`, `BallotQuestionType`, etc.)
- [ ] Create `app/app/[condominiumSlug]/layout.tsx` — shell layout for tenant pages (navbar, sidebar placeholder)
- [ ] Create `app/super-admin/layout.tsx` — shell layout for super-admin pages
- [ ] Add global loading skeleton component to `components/ui/`
- [ ] Verify `next.config.ts` allows Supabase image domains for logos/avatars

---

## Definition of Done

- App builds without TypeScript or lint errors
- Supabase client is importable in both server and client components
- Middleware correctly blocks unauthenticated access to protected routes
- All shadcn components are installed and importable

---

## Notes

- Use `@supabase/ssr` (not the deprecated `auth-helpers-nextjs`)
- The `condominium_id` RLS pattern means every DB query needs to be scoped — the server client should always have access to the authenticated session
- shadcn uses Tailwind v4 in this project; verify compatibility during init
