# F16 — Audit Log

**Status:** `pending`
**Branch:** `claude/feature-audit-log`
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
- [ ] Migration: `audit_logs` table
  ```
  id, condominium_id, actor_id (user_id), action text, entity_type text,
  entity_id uuid nullable, metadata jsonb nullable, created_at
  ```
- [ ] RLS: SELECT for admins of the matching condominium; super-admins can SELECT all; no INSERT/UPDATE/DELETE via API (use service role only)
- [ ] Add index on `(condominium_id, created_at)` for efficient filtering

### Audit Log Helper
- [ ] Create `lib/audit/log-action.ts`:
  ```ts
  logAction({
    condominiumId, actorId, action, entityType, entityId?, metadata?
  })
  ```
  - Uses Supabase service role client to bypass RLS
  - Called from server actions after successful operations

### Log Actions to Wire Up
Add `logAction(...)` calls in the following server actions (after their primary operation):
- [ ] F04: user invited / joined / removed; system role changed; functional title assigned
- [ ] F06: budget published
- [ ] F07: project created / status changed
- [ ] F09: initiative approved / rejected / converted
- [ ] F10: ballot created / opened / closed / results published; vote cast (voter_id + ballot_id)
- [ ] F11: document uploaded / deleted / permissions changed
- [ ] F12: announcement published
- [ ] F13: maintenance request status changed

### Audit Log Pages
- [ ] Create `app/app/[condominiumSlug]/settings/audit-log/page.tsx`:
  - Admin-only
  - Filterable list: date range picker, actor (member select), entity type dropdown
  - Table: timestamp, actor name, action, entity type, entity ID (linked if applicable), metadata preview
  - Pagination (server-side, cursor or offset)
  - No delete or edit actions — read-only

- [ ] Create `app/super-admin/audit-log/page.tsx`:
  - Same as above but with an additional "Condominium" filter column
  - Super-admin can see all condominiums' logs

### Components
- [ ] Create `components/audit/audit-log-table.tsx` — shared table component used by both admin and super-admin views
- [ ] Create `components/audit/audit-log-filters.tsx` — filter bar component

---

## Definition of Done

- All listed actions are logged via `logAction()` helper
- Condominium admin can view and filter logs for their condominium
- Super-admin can view logs across all condominiums with condominium filter
- Logs are read-only — no edit or delete actions in UI or via RLS
- Filtering by date, actor, and entity type works correctly

---

## Notes

- `action` field uses a consistent naming convention: `"entity.action"` format — e.g. `"project.created"`, `"ballot.opened"`, `"vote.cast"`, `"document.deleted"`
- `metadata` stores contextual details: e.g. for `"ballot.opened"` — `{ ballot_title: "..." }`, for `"vote.cast"` — `{ ballot_id: "...", voter_id: "..." }`
- `logAction()` must use the service role client (bypasses RLS) since it needs to write to audit_logs regardless of calling user's role
- Audit logs should never be deleted — use an append-only policy enforced at RLS level (no DELETE policy)
