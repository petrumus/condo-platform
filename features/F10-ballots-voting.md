# F10 — Ballots & Voting

**Status:** `pending`
**Branch:** `claude/feature-ballots-voting`
**Spec sections:** §6.6 Ballots & Voting

---

## Context

Admins create digital ballot papers for resident voting. Supports Yes/No, single-choice, and multi-choice questions. Each member votes once; votes are tied to identity. Results are tallied on close. Optional quorum threshold. Admin can export results as CSV.

**Lifecycle:** `Draft → Open → Closed → Results Published`

**Key files to read before starting:**
- `CLAUDE.md` — schema for `ballots`, `votes`
- `features/F03-multitenancy-condominium.md` — RLS
- `features/F09-initiatives.md` — linking ballots to initiatives
- `condominium-platform-spec.md` §6.6

---

## Tasks

### Database
- [ ] Migration: `ballots` table
  ```
  id, condominium_id, title, description, question_type
  ('yes_no'|'single_choice'|'multi_choice'),
  options jsonb (array of {id, label}),
  open_at timestamptz, close_at timestamptz, quorum_pct numeric nullable,
  linked_initiative_id uuid nullable fk,
  status ('draft'|'open'|'closed'|'results_published'),
  created_by, created_at
  ```
- [ ] Migration: `votes` table
  ```
  id, ballot_id, voter_id, selected_options jsonb (array of option ids), voted_at
  UNIQUE(ballot_id, voter_id)
  ```
- [ ] RLS: SELECT ballots for all members (non-draft); INSERT/UPDATE for admins only
- [ ] RLS: INSERT votes for any member (once per ballot, enforced by unique constraint); SELECT votes for admins only
- [ ] DB function: `has_voted(ballot_id, user_id)` → boolean (used in UI)

### Ballot List Page
- [ ] Create `app/app/[condominiumSlug]/ballots/page.tsx`:
  - Tabs: Open | Upcoming | Closed | Draft (admin only)
  - Show: title, question type, open/close dates, current status
  - Voting status indicator: "You voted" | "Vote now" | "Voting closed"
  - Link to create ballot (admin only)

### Ballot Detail & Voting Page
- [ ] Create `app/app/[condominiumSlug]/ballots/[id]/page.tsx`:
  - Title, description, question type, open/close dates, quorum threshold (if set)
  - Linked initiative link (if applicable)
  - **Voting interface** (shown if ballot is open and user hasn't voted):
    - Yes/No: two radio buttons
    - Single choice: radio group of options
    - Multi-choice: checkboxes
    - Submit vote button
  - **Already voted state:** "You have already voted" message (no option to change)
  - **Closed state:** "Voting has closed. Results will be published soon."
  - Admin sees vote tally even before results are published (admin view)
- [ ] Server action: `castVote(ballotId, selectedOptions[])`:
  - Validates ballot is open
  - Validates user hasn't voted
  - Inserts vote row
  - Triggers notification/audit log

### Results Page
- [ ] Create `app/app/[condominiumSlug]/ballots/[id]/results/page.tsx`:
  - Visible to all members after status = 'results_published'
  - Show vote counts per option with percentage bars
  - Show total votes cast vs. total eligible voters
  - Quorum indicator: met / not met (if threshold was set)
  - If quorum not met: prominent "Ballot invalid — quorum not reached" notice
  - Admin: "Export CSV" button

### Create/Edit Ballot (Admin)
- [ ] Create `app/app/[condominiumSlug]/ballots/new/page.tsx`
- [ ] Create `components/ballots/ballot-form.tsx`:
  - Title, description
  - Question type selector
  - Options builder (for single/multi choice)
  - Date pickers: open_at, close_at
  - Quorum % field (optional)
  - Link to initiative (optional select)
- [ ] Server actions in `ballots/actions.ts`:
  - `createBallot(data)` — creates in 'draft' status
  - `updateBallot(id, data)` — only allowed in 'draft'
  - `openBallot(id)` — sets status to 'open', triggers notification
  - `closeBallot(id)` — sets status to 'closed', tallies results
  - `publishResults(id)` — sets status to 'results_published', triggers notification
  - `exportResultsCsv(id)` → returns CSV file

### Real-Time Vote Count (Optional Enhancement)
- [ ] Subscribe to `votes` table changes via Supabase Realtime in the results page for live tally updates

---

## Definition of Done

- Admin can create, open, close, and publish results for a ballot
- Each member can vote once; duplicate votes are rejected
- Results page shows accurate tallies with quorum assessment
- Admin can export results as CSV
- Non-admins cannot see draft ballots

---

## Notes

- `selected_options` in `votes` is a JSONB array of option IDs (strings from the ballot's `options` JSONB)
- For Yes/No ballots, options are implicitly `[{id: "yes", label: "Yes"}, {id: "no", label: "No"}]` — no need to store in DB
- Quorum calculation: `total_votes / total_eligible_voters >= quorum_pct / 100`
- Total eligible voters = count of `condominium_members` in the condominium at ballot close time
- Admin can see who voted for what (not anonymous) — this is by design per spec
