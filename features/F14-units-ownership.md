# F14 — Units & Ownership

**Status:** `completed`
**Branch:** `claude/build-units-ownership-feature-qUMFU`
**Spec sections:** §6.10 Units & Ownership

---

## Context

Each condominium maintains a register of units (apartments). Each unit has an area and ownership share percentage. Units can be linked to registered user accounts or stored as unregistered owner records. Ownership share is used as metadata for weighted voting and display — it does not affect system permissions.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `units`, `unit_owners`
- `features/F03-multitenancy-condominium.md` — RLS
- `features/F04-user-roles-members.md` — member management context
- `docs/condominium-platform-spec.md` §6.10

---

## Tasks

### Database
- [x] Migration: `units` table
  ```
  id, condominium_id, unit_number text, floor text nullable,
  building_section text nullable, area_m2 numeric, ownership_share_pct numeric nullable,
  created_at
  ```
- [x] Migration: `unit_owners` table
  ```
  id, unit_id, user_id uuid nullable fk (auth.users), owner_name text, owner_email text nullable,
  created_at
  ```
- [x] RLS: SELECT for all members; INSERT/UPDATE/DELETE for admins only
- [x] DB trigger or function: auto-calculate `ownership_share_pct` from `area_m2` relative to total area if ownership_share_pct is null (implemented as `recalculateOwnershipShares` server action)

### Unit Register Page (Admin)
- [x] Create `app/app/[condominiumSlug]/settings/units/page.tsx`:
  - Admin-only page
  - Table of all units: unit number, floor, section, area, ownership share, owner(s)
  - "Add Unit" button
  - Per-row actions: Edit, Delete (with confirmation)
  - Summary at bottom: total units, total area, ownership share total (should sum to 100%)

### Add / Edit Unit
- [x] Create `components/settings/units/unit-dialog.tsx` — modal form:
  - Unit number (required)
  - Floor (optional text)
  - Building section (optional text)
  - Area in m² (required)
  - Ownership share % (optional — if blank, show auto-calculated value)
- [x] Create `components/settings/units/unit-owners-dialog.tsx` — manage owners per unit:
  - Add existing members (user lookup) or enter unregistered owner (name + email)
  - Remove owners with trash icon
- [x] Create `components/settings/units/units-table.tsx` — client table with edit/delete/owners dialogs

### Server Actions
- [x] Server actions in `settings/units/actions.ts`:
  - `createUnit(data)` — creates unit row
  - `updateUnit(id, data)` — updates unit fields
  - `deleteUnit(id)` — removes unit and its owner records
  - `addUnitOwner(unitId, { userId?, ownerName, ownerEmail })` — links owner to unit
  - `removeUnitOwner(ownerId)` — removes owner link
  - `recalculateOwnershipShares(condominiumId)` — recalculates all shares based on area_m2

### User: My Unit View
- [x] Created `app/app/[condominiumSlug]/settings/units/my-unit/page.tsx`:
  - Shows user's linked unit(s) with area, floor, section, ownership share
  - Shows ownership record details (name, email)
  - Empty state with instructions to contact admin
  - Admins are redirected to the full units admin page

---

## Database Migrations Added

- `supabase/migrations/20260228000012_units.sql` — `units` + `unit_owners` tables with RLS

---

## Definition of Done

- Admin can create, edit, and delete units
- Admin can link registered members or enter unregistered owner details
- Ownership share is stored per unit and can be manually set or auto-calculated
- Users can view their own unit details (via user_id link in unit_owners)
- Ownership share total is visible and warns if it doesn't sum to 100%

---

## Notes

- A unit can have multiple owners (co-ownership) — `unit_owners` is a junction table
- `user_id` is nullable in `unit_owners` to support owners who haven't registered on the platform
- Auto-calculation formula: `ownership_share_pct = (unit.area_m2 / sum(all_units.area_m2)) * 100`
- Weighted voting (using ownership share) is optional per ballot — this is metadata only in v1
