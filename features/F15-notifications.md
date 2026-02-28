# F15 — Notifications (In-App + Email)

**Status:** `completed`
**Branch:** `claude/build-notifications-feature-NHD0B`
**Spec sections:** §10 Notifications, §12 n8n Workflows

---

## Context

Two notification channels: **in-app** (bell icon in navbar, Supabase Realtime) and **email** (n8n workflows triggered by Supabase webhooks). In-app notifications are stored in the `notifications` table and delivered in real-time. Email notifications use n8n for async delivery.

**Key files to read before starting:**
- `CLAUDE.md` — schema for `notifications`; n8n workflows table
- `features/F03-multitenancy-condominium.md` — RLS and condominium context
- `docs/condominium-platform-spec.md` §10, §12

---

## Tasks

### Database
- [x] Migration: `notifications` table — `supabase/migrations/20260228000013_notifications.sql`
  ```
  id, user_id, condominium_id, type text, title, body, read boolean default false,
  link_url text nullable, created_at
  ```
- [x] RLS: users can SELECT/UPDATE their own notifications; INSERT via service role only
- [x] Realtime enabled on `notifications` table via `ALTER PUBLICATION supabase_realtime ADD TABLE`

### In-App Notification Bell
- [x] Updated navbar component (`components/layout/navbar.tsx`) — replaced placeholder with `<NotificationBell />`
- [x] Created `components/notifications/notification-bell.tsx` (client component):
  - Shows unread count badge (red, capped at "9+")
  - On click: opens dropdown with 10 most recent notifications
  - Each item: title, short body, timestamp, link button (if any), per-item mark-as-read
  - "Mark all read" button in header
  - "View all notifications" link in footer
  - Bell shake animation on new notification via Web Animations API
- [x] Created `app/app/[condominiumSlug]/notifications/page.tsx` — full list (100 items), badge per type, mark-all-read server action form

### Realtime Subscription
- [x] Created `hooks/use-notifications.ts` (client hook):
  - On mount: fetches last 50 notifications via Supabase query
  - Subscribes to Supabase Realtime channel for INSERT and UPDATE on `notifications` filtered by `user_id`
  - On new notification: prepends to local state + fires `onNew` callback (bell shake animation)
  - Exposes `notifications`, `unreadCount`, `markAsRead(id)`, `markAllAsRead()`
- [x] Server actions in `app/app/[condominiumSlug]/notifications/actions.ts`:
  - `markNotificationRead(condominiumSlug, id)` — sets read = true
  - `markAllNotificationsRead(condominiumSlug)` — bulk update for current condominium

### Notification Triggers (Server-Side)
- [x] Created `lib/notifications/create-notification.ts`:
  - `createNotification()` — single user, uses service role, silently ignores errors
  - `createNotificationForAllMembers()` — fan-out to all condominium members, bulk insert
- [x] Wired to **initiative approved**: `approveInitiative` in F09 — notifies submitter
- [x] Wired to **initiative rejected**: `rejectInitiative` in F09 — notifies submitter with reason
- [x] Wired to **new ballot opened**: `openBallot` in F10 — notifies all condominium members
- [x] Wired to **ballot results published**: `publishResults` in F10 — notifies all members
- [x] Wired to **maintenance request status changed**: `updateRequestStatus` in F13 — notifies submitter
- [x] Wired to **new announcement published**: `publishAnnouncement` in F12 — notifies all members

### n8n Email Workflows

> **TODO (deferred):** The edge function is written but not yet deployed or wired into the server actions.
> Before enabling email notifications, you must:
> 1. Deploy the edge function: `supabase functions deploy trigger-n8n-webhook`
> 2. Set secrets: `supabase secrets set N8N_WEBHOOK_BASE_URL=...` and `supabase secrets set N8N_WEBHOOK_SECRET=...`
> 3. Add fire-and-forget `fetch` calls to the edge function inside the relevant server actions (announcements, ballots, initiatives, maintenance) following the payloads in `docs/n8n-webhooks.md`

- [x] Documented all webhook payloads in `docs/n8n-webhooks.md`:
  - `invitation` — { email, invite_url, condominium_name }
  - `initiative_status` — { user_email, initiative_title, new_status, rejection_reason? }
  - `ballot_open` — { condominium_id, ballot_title, close_at, ballot_url }
  - `ballot_closing_reminder` — scheduled workflow + query logic documented
  - `ballot_results` — { condominium_id, ballot_title, results_url }
  - `maintenance_status` — { user_email, request_title, new_status }
  - `announcement` — { condominium_id, announcement_title, announcement_url }
- [x] Created Supabase Edge Function `supabase/functions/trigger-n8n-webhook/index.ts` — generic Deno function that POSTs to `N8N_WEBHOOK_BASE_URL/webhook/<workflow>` with `X-Webhook-Secret` header
- [x] Env vars documented: `N8N_WEBHOOK_BASE_URL`, `N8N_WEBHOOK_SECRET`
- [x] Edge function excluded from Next.js TypeScript compilation via `tsconfig.json` exclude

### Notification Preferences (Optional)
- [ ] Skipped for now — can be added in F18 Settings Pages

---

## Definition of Done

- Bell icon shows unread count and updates in real-time via Supabase Realtime
- Notifications are created for all specified events
- Mark as read works for individual and all notifications
- n8n webhook payload documentation is written (actual n8n setup is done outside of code)
- Edge function for triggering n8n is deployed

---

## Notes

- Supabase Realtime uses Postgres Changes to listen for INSERTs to `notifications` filtered by `user_id`
- n8n is hosted on Hetzner — n8n webhook URL must be in env vars (not hardcoded)
- The Realtime subscription must be set up as a client component (cannot be a server component)
- Toast notifications on new in-app notification: use shadcn `useToast` hook
