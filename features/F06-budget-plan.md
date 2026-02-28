# F06 — Yearly Budget Plan

**Status:** `pending`
**Branch:** `claude/feature-budget-plan`
**Spec sections:** §6.2 Yearly Budget Plan

---

## Context

One published budget per year per condominium. Structured as line items (category, amount, notes). Read-only after publishing. Admins can draft, edit, and publish. Previous years are archived and accessible.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `budget_plans`, `budget_line_items`
- `features/F03-multitenancy-condominium.md` — RLS setup
- `docs/condominium-platform-spec.md` §6.2

---

## Tasks

### Database
- [ ] Migration: `budget_plans` table (id, condominium_id, year int, status 'draft'|'published', published_at)
- [ ] Migration: `budget_line_items` table (id, budget_plan_id, category text, amount numeric, notes text, sort_order int)
- [ ] RLS: SELECT for all members; INSERT/UPDATE/DELETE for admin only on `budget_plans`
- [ ] RLS: INSERT/UPDATE/DELETE for admin only on `budget_line_items`

### Read-Only Budget View
- [ ] Create `app/app/[condominiumSlug]/budget/[year]/page.tsx`:
  - Fetch published budget for the given year
  - Show "No budget published for [year]" if none exists
  - Display line items in a table: Category | Planned Amount | Notes
  - Show total at the bottom
  - Display publication date
- [ ] Create `components/budget/budget-table.tsx` — reusable table component
- [ ] Create `components/budget/year-selector.tsx` — navigate between available years

### Budget Editor (Admin Only)
- [ ] Create `app/app/[condominiumSlug]/budget/[year]/edit/page.tsx`:
  - Admin-only; redirect non-admins
  - If no draft exists for the year, show "Create budget" button
  - If draft exists: editable line items table
  - Add/remove/reorder line items inline
  - Save as draft (auto-save or manual save button)
  - Publish button (with confirmation dialog) — sets status to 'published', records published_at
  - Cannot edit a published budget (show read-only view with "Edit" button disabled)
- [ ] Server actions in `budget/actions.ts`:
  - `createBudgetPlan(year)` — creates a draft
  - `saveBudgetDraft(planId, lineItems[])` — upserts line items
  - `publishBudget(planId)` — sets status to published; validates at least one line item exists
  - `addLineItem(planId)` — adds empty line item
  - `deleteLineItem(lineItemId)`

### Navigation
- [ ] From dashboard, "Yearly Budget" card links to `/budget/[currentYear]`
- [ ] Admin sees an "Edit Budget" button on the read-only view

---

## Definition of Done

- Admin can create a draft budget with line items, save, and publish
- Published budget is read-only for all users
- Previous years' budgets are accessible via year selector
- Non-admins cannot access the edit page

---

## Notes

- `year` in the URL is the calendar year (e.g. 2025, 2026)
- There can be at most one published budget per year per condominium; the DB should have a unique constraint on (condominium_id, year, status) where status = 'published'
- Consider adding a `currency` field to `budget_plans` for future i18n support (out of scope v1, but easy to add now)
