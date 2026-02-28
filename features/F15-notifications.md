# F15 — Notifications (In-App + Email)

**Status:** `pending`
**Branch:** `claude/feature-notifications`
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
- [ ] Migration: `notifications` table
  ```
  id, user_id, condominium_id, type text, title, body, read boolean default false,
  link_url text nullable, created_at
  ```
- [ ] RLS: users can only SELECT their own notifications; INSERT via service role (server action / edge function); UPDATE (mark as read) for own notifications

### In-App Notification Bell
- [ ] Update navbar component (`components/layout/navbar.tsx`) to include bell icon
- [ ] Create `components/notifications/notification-bell.tsx` (client component):
  - Shows unread count badge
  - On click: opens dropdown with recent notifications
  - Each item: title, short body, timestamp, link (if any)
  - "Mark all as read" button
  - Link to full notifications page (optional)
- [ ] Create `app/app/[condominiumSlug]/notifications/page.tsx` — full list with pagination

### Realtime Subscription
- [ ] Create `hooks/use-notifications.ts` (client hook):
  - On mount: subscribe to Supabase Realtime channel for `notifications` WHERE `user_id = me`
  - On new notification: update local state, show toast
  - Expose `notifications`, `unreadCount`, `markAsRead(id)`, `markAllAsRead()`
- [ ] Server action: `markNotificationRead(id)` — sets read = true
- [ ] Server action: `markAllNotificationsRead(condominiumId)` — bulk update

### Notification Triggers (Server-Side)
Create a helper `lib/notifications/create-notification.ts` that inserts a notification row:
- [ ] Wire to **initiative status changed**: call from `approveInitiative`/`rejectInitiative` in F09 — notify submitter
- [ ] Wire to **new ballot opened**: call from `openBallot` in F10 — notify all condominium members
- [ ] Wire to **ballot results published**: call from `publishResults` in F10 — notify all members
- [ ] Wire to **maintenance request status changed**: call from `updateRequestStatus` in F13 — notify submitter
- [ ] Wire to **new announcement published**: call from `publishAnnouncement` in F12 — notify all members

### n8n Email Workflows
Each workflow is set up in n8n (not in code, but document the webhook payload format):
- [ ] Document webhook payload for each workflow in `docs/n8n-webhooks.md`:
  - **Send invitation email** — payload: { email, invite_url, condominium_name }
  - **Initiative status changed** — payload: { user_email, initiative_title, new_status, rejection_reason? }
  - **New ballot opened** — payload: { condominium_id, ballot_title, close_at, ballot_url }
  - **Ballot closing reminder (24h)** — scheduled: query voters who haven't voted
  - **Ballot results published** — payload: { condominium_id, ballot_title, results_url }
  - **Maintenance request status changed** — payload: { user_email, request_title, new_status }
  - **New announcement** — payload: { condominium_id, announcement_title, announcement_url }
- [ ] Create Supabase Edge Function `trigger-n8n-webhook.ts` — generic helper that POSTs to n8n webhook URL with payload; called from server actions
- [ ] Add n8n webhook URL env vars: `N8N_WEBHOOK_BASE_URL`, `N8N_WEBHOOK_SECRET`

### Notification Preferences (Optional)
- [ ] Create `app/app/[condominiumSlug]/settings/notifications/page.tsx`:
  - Toggle: receive email notifications for each notification type
  - Store preferences in `notification_preferences` table or as JSONB on `condominium_members`

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
