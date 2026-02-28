# F14 — Units & Ownership

**Status:** `pending`
**Branch:** `claude/feature-units-ownership`
**Spec sections:** §6.10 Units & Ownership

---

## Context

Each condominium maintains a register of units (apartments). Each unit has an area and ownership share percentage. Units can be linked to registered user accounts or stored as unregistered owner records. Ownership share is used as metadata for weighted voting and display — it does not affect system permissions.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `units`, `unit_owners`
- `features/F03-multitenancy-condominium.md` — RLS
- `features/F04-user-roles-members.md` — member management context
- `condominium-platform-spec.md` §6.10

---

## Tasks

### Database
- [ ] Migration: `units` table
  ```
  id, condominium_id, unit_number text, floor text nullable,
  building_section text nullable, area_m2 numeric, ownership_share_pct numeric nullable,
  created_at
  ```
- [ ] Migration: `unit_owners` table
  ```
  id, unit_id, user_id uuid nullable fk (auth.users), owner_name text, owner_email text nullable,
  created_at
  ```
- [ ] RLS: SELECT for all members; INSERT/UPDATE/DELETE for admins only
- [ ] DB trigger or function: auto-calculate `ownership_share_pct` from `area_m2` relative to total area if ownership_share_pct is null (optional — admin can also enter manually)

### Unit Register Page (Admin)
- [ ] Create `app/app/[condominiumSlug]/settings/units/page.tsx`:
  - Admin-only page
  - Table of all units: unit number, floor, section, area, ownership share, owner(s)
  - "Add Unit" button
  - Per-row actions: Edit, Delete (with confirmation)
  - Summary at bottom: total units, total area, ownership share total (should sum to 100%)

### Add / Edit Unit
- [ ] Create `components/settings/units/unit-dialog.tsx` — modal form:
  - Unit number (required)
  - Floor (optional text)
  - Building section (optional text)
  - Area in m² (required)
  - Ownership share % (optional — if blank, show auto-calculated value)
  - Owner(s) section: add existing members (user lookup) or enter unregistered owner (name + email)

### Server Actions
- [ ] Server actions in `settings/units/actions.ts`:
  - `createUnit(data)` — creates unit row
  - `updateUnit(id, data)` — updates unit fields
  - `deleteUnit(id)` — removes unit and its owner records
  - `addUnitOwner(unitId, { userId?, ownerName, ownerEmail })` — links owner to unit
  - `removeUnitOwner(ownerId)` — removes owner link
  - `recalculateOwnershipShares(condominiumId)` — recalculates all shares based on area_m2

### User: My Unit View
- [ ] On the user profile or a dedicated page, show the user's unit details (if linked via unit_owners.user_id)
- [ ] Alternatively, add a "My Unit" section to the dashboard or settings

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
