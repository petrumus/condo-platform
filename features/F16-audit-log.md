# F16 — Audit Log

**Status:** `completed`
**Branch:** `claude/build-audit-log-feature-Q6L7e`
**Spec sections:** §11 Audit Log

---

## Context

All significant actions are logged to `audit_logs`. Condominium admins can view logs for their condominium. Super-admins can view across all condominiums. Logs are read-only and cannot be deleted.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `audit_logs`
- `features/F03-multitenancy-condominium.md` — RLS, is_admin, is_super_admin helpers
- `docs/condominium-platform-spec.md` §11

---

## Tasks

### Database
- [x] Migration: `audit_logs` table — already created in `20260228000005_super_admin.sql`
  ```
  id, condominium_id, actor_id (user_id), action text, entity_type text,
  entity_id uuid nullable, metadata jsonb nullable, created_at
  ```
- [x] RLS: SELECT for admins of the matching condominium; super-admins can SELECT all; no INSERT/UPDATE/DELETE via API (use service role only)
- [x] Index on `(condominium_id, created_at)` — included in existing migration

### Audit Log Helper
- [x] Created `lib/audit/log-action.ts`:
  ```ts
  logAction({
    condominiumId, actorId, action, entityType, entityId?, metadata?
  })
  ```
  - Uses Supabase service role client to bypass RLS
  - Called from server actions after successful operations
  - Errors are swallowed so logging failures never break the primary operation

### Log Actions Wired Up
- [x] F04: user invited / removed; system role changed; functional title assigned (`settings/members/actions.ts`)
- [x] F06: budget published (`budget/actions.ts`)
- [x] F07: project created / status changed (`projects/actions.ts`)
- [x] F09: initiative approved / rejected / converted (`initiatives/actions.ts`)
- [x] F10: ballot created / opened / closed / results published; vote cast (`ballots/actions.ts`)
- [x] F11: document uploaded / deleted / permissions changed (`documents/actions.ts`)
- [x] F12: announcement published (`announcements/actions.ts`)
- [x] F13: maintenance request status changed (`maintenance/actions.ts`)

### Audit Log Pages
- [x] Created `app/app/[condominiumSlug]/settings/audit-log/page.tsx`:
  - Admin-only (redirects non-admins to dashboard)
  - Filterable: action text, actor (member select), entity type dropdown, date range
  - Table: timestamp, actor name+email, action badge, entity type+id, metadata JSON preview
  - Server-side offset pagination (50 per page)
  - Read-only — no edit or delete actions

- [x] `app/super-admin/audit-log/page.tsx` — already implemented in F17 (platform-wide view)

---

## Definition of Done

- [x] All listed actions are logged via `logAction()` helper
- [x] Condominium admin can view and filter logs for their condominium
- [x] Super-admin can view logs across all condominiums (F17)
- [x] Logs are read-only — no edit or delete actions in UI or via RLS
- [x] Filtering by date, actor, and entity type works correctly
- [x] Build passes cleanly

---

## Notes

- `action` field uses `"entity.action"` naming convention — e.g. `"project.created"`, `"ballot.opened"`, `"vote.cast"`, `"document.deleted"`
- `metadata` stores contextual details: e.g. for `"ballot.opened"` — `{ ballot_title: "..." }`, for `"vote.cast"` — `{ ballot_id: "...", voter_id: "..." }`
- `logAction()` uses the service role client (bypasses RLS) to write to audit_logs regardless of calling user's role
- Audit logs are append-only — no DELETE RLS policy
