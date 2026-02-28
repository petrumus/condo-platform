# n8n Webhook Payload Reference

> **Added in F15 — Notifications (In-App + Email)**
>
> Each section documents one n8n workflow. The workflow is triggered by posting to:
> `POST https://<N8N_HOST>/webhook/<workflow-name>`
>
> The Supabase Edge Function `supabase/functions/trigger-n8n-webhook/index.ts` is the generic
> caller. It accepts `{ workflow, payload }` and forwards the payload to the correct n8n URL with
> a shared secret in the `X-Webhook-Secret` header.

---

## Environment Variables

| Variable              | Description                                            |
|-----------------------|--------------------------------------------------------|
| `N8N_WEBHOOK_BASE_URL`| Base URL of the n8n instance, e.g. `https://n8n.example.com` |
| `N8N_WEBHOOK_SECRET`  | Shared secret; validated by n8n as `X-Webhook-Secret` |

---

## Workflows

### 1. `invitation` — Send invitation email

Triggered when a user is invited to join a condominium.

**Workflow name:** `invitation`

**Payload:**
```json
{
  "email": "invitee@example.com",
  "invite_url": "https://app.example.com/invite/<token>",
  "condominium_name": "Sunset Tower"
}
```

**n8n action:** Send email to `email` with a link to `invite_url`.

---

### 2. `initiative_status` — Initiative status changed

Triggered when an admin approves or rejects a resident initiative.

**Workflow name:** `initiative_status`

**Payload:**
```json
{
  "user_email": "submitter@example.com",
  "initiative_title": "Install bike racks",
  "new_status": "approved",
  "rejection_reason": null
}
```

**Fields:**
- `new_status`: `"approved"` | `"rejected"`
- `rejection_reason`: string or `null` (only set when status = `"rejected"`)

**n8n action:** Send email to `user_email` with the status outcome.

---

### 3. `ballot_open` — New ballot opened

Triggered when an admin opens a ballot for voting.

**Workflow name:** `ballot_open`

**Payload:**
```json
{
  "condominium_id": "uuid",
  "ballot_title": "Approve 2026 budget",
  "close_at": "2026-03-15T23:59:00Z",
  "ballot_url": "https://app.example.com/app/sunset-tower/ballots/<id>"
}
```

**n8n action:** Query `condominium_members` for this `condominium_id`, look up each member's
email via `profiles`, then send email to all members with a link to cast their vote.

---

### 4. `ballot_closing_reminder` — Ballot closing in 24 hours

**Scheduled workflow** — runs once per hour, checks for ballots closing within 24 hours.

**Triggered by:** n8n schedule node + Supabase query

**Query logic (runs in n8n via HTTP Request to Supabase REST API):**
```sql
SELECT b.id, b.title, b.condominium_id, b.close_at
FROM ballots b
WHERE b.status = 'open'
  AND b.close_at BETWEEN now() AND now() + interval '24 hours'
```

For each result, fetch members who have NOT yet voted:
```sql
SELECT cm.user_id
FROM condominium_members cm
WHERE cm.condominium_id = :condominium_id
  AND cm.user_id NOT IN (
    SELECT voter_id FROM votes WHERE ballot_id = :ballot_id
  )
```

Then look up their emails from `profiles` and send the reminder email.

**Email payload per member:**
```json
{
  "user_email": "voter@example.com",
  "ballot_title": "Approve 2026 budget",
  "close_at": "2026-03-15T23:59:00Z",
  "ballot_url": "https://app.example.com/app/sunset-tower/ballots/<id>"
}
```

---

### 5. `ballot_results` — Ballot results published

Triggered when an admin publishes ballot results.

**Workflow name:** `ballot_results`

**Payload:**
```json
{
  "condominium_id": "uuid",
  "ballot_title": "Approve 2026 budget",
  "results_url": "https://app.example.com/app/sunset-tower/ballots/<id>/results"
}
```

**n8n action:** Same fan-out as `ballot_open` — email all condominium members.

---

### 6. `maintenance_status` — Maintenance request status changed

Triggered when an admin updates the status of a maintenance request.

**Workflow name:** `maintenance_status`

**Payload:**
```json
{
  "user_email": "requester@example.com",
  "request_title": "Broken hallway light on floor 3",
  "new_status": "in_progress"
}
```

**Fields:**
- `new_status`: `"open"` | `"in_review"` | `"in_progress"` | `"resolved"` | `"closed"`

**n8n action:** Send email to `user_email` with the updated status.

---

### 7. `announcement` — New announcement published

Triggered when an admin publishes a new announcement.

**Workflow name:** `announcement`

**Payload:**
```json
{
  "condominium_id": "uuid",
  "announcement_title": "Water shut-off on March 10",
  "announcement_url": "https://app.example.com/app/sunset-tower/announcements/<id>"
}
```

**n8n action:** Fan-out email to all condominium members.

---

## Calling the Edge Function from Server Actions

```typescript
// Example: trigger n8n webhook from a Next.js server action
async function triggerN8nWebhook(workflow: string, payload: Record<string, unknown>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return // silently skip if not configured

  try {
    await fetch(`${supabaseUrl}/functions/v1/trigger-n8n-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ workflow, payload }),
    })
  } catch {
    // Non-critical — email failures should not break the main action
  }
}
```
