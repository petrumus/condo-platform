# F06 — Yearly Budget Plan

**Status:** `completed`
**Branch:** `claude/build-yearly-budget-plan-nypk2`
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
- [x] Migration: `budget_plans` table (id, condominium_id, year int, status 'draft'|'published', published_at)
- [x] Migration: `budget_line_items` table (id, budget_plan_id, category text, amount numeric, notes text, sort_order int)
- [x] RLS: SELECT for all members; admins also see drafts; INSERT/UPDATE/DELETE for admin only on `budget_plans`
- [x] RLS: SELECT mirrors plan visibility; INSERT/UPDATE/DELETE for admin only on `budget_line_items`

### Read-Only Budget View
- [x] Create `app/app/[condominiumSlug]/budget/[year]/page.tsx`:
  - Fetch published budget for the given year
  - Show "No budget published for [year]" if none exists
  - Display line items in a table: Category | Planned Amount | Notes
  - Show total at the bottom
  - Display publication date
- [x] Create `components/budget/budget-table.tsx` — reusable table component
- [x] Create `components/budget/year-selector.tsx` — navigate between available years

### Budget Editor (Admin Only)
- [x] Create `app/app/[condominiumSlug]/budget/[year]/edit/page.tsx`:
  - Admin-only; redirect non-admins
  - If no plan exists for the year, show "Create budget" button
  - If draft exists: editable line items table
  - Add/remove/reorder line items inline
  - Manual save draft button
  - Publish button (with confirmation dialog) — sets status to 'published', records published_at
  - Cannot edit a published budget (show locked view with link back to read view)
- [x] `components/budget/budget-editor.tsx` — client component for interactive editing
- [x] Server actions in `app/app/[condominiumSlug]/budget/actions.ts`:
  - `createBudgetPlan(condominiumSlug, year)` — creates a draft
  - `saveBudgetDraft(condominiumSlug, planId, year, lineItems[])` — replaces line items
  - `publishBudget(condominiumSlug, planId, year)` — validates ≥1 item, sets published

### Navigation
- [x] Dashboard "Yearly Budget" card links to `/budget/[currentYear]` (already wired in F05)
- [x] Admin sees "Edit Budget" / "Create Budget" button on the read-only view

---

## Database Migrations

- `supabase/migrations/20260228000004_budget.sql` — budget_plans + budget_line_items tables with RLS

---

## Definition of Done

- Admin can create a draft budget with line items, save, and publish
- Published budget is read-only for all users
- Previous years' budgets are accessible via year selector
- Non-admins cannot access the edit page

---

## Notes

- `year` in the URL is the calendar year (e.g. 2025, 2026)
- Unique constraint on `(condominium_id, year)` — one plan per year per condominium
- Line items are replaced in bulk on each save (delete + insert) for simplicity
