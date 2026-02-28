# Condominium Management Platform — Product Specification

## 1. Overview

A multi-tenant SaaS platform for condominium management. Each condominium is an isolated workspace. Platform administrators (super-admins) manage the platform itself; condominium administrators manage their own condominium and its residents.

The platform is built on **Next.js** (frontend), **Supabase** (database, auth, storage, edge functions), and **n8n** (workflow automation for tasks Supabase cannot handle natively — e.g. scheduled notifications, complex email workflows).

---

## 2. Terminology

| Term | Meaning |
|---|---|
| **Platform** | The SaaS product itself |
| **Condominium** | A tenant workspace (one per building/association) |
| **Functional Title** | A named role within condominium governance (Administrator, Councilor, etc.) |
| **System Role** | The access level of a user within the platform |
| **Unit** | An apartment or property within a condominium |
| **Owner** | A resident/owner linked to one or more units |

---

## 3. User Roles & Permissions

### 3.1 System Roles

Three system roles exist, scoped per condominium (except super-admin which is platform-wide):

**`super-admin`**
- Full access to all condominiums and platform settings
- Can create, suspend, or delete condominium workspaces
- Can assign `admin` role to users within any condominium
- Views platform-wide audit logs

**`admin`** *(scoped to one condominium)*
- Full control over their condominium workspace
- Manages users, approves/rejects initiatives, creates ballots, publishes announcements
- Can assign functional titles to users
- Can configure document folder permissions
- Views condominium-level audit log

**`user`** *(scoped to one condominium)*
- Read access to public-facing content (budget, projects, announcements, approved documents)
- Can submit initiatives and maintenance requests
- Can vote in open ballots
- Cannot access admin panels or audit logs

### 3.2 Functional Titles

Functional titles represent governance roles within the condominium. They are **display labels** and do not change system permissions — they appear on the administration page and in the context of governance documents.

Built-in titles:
- Administrator
- Councilor
- Auditor
- Accountant

Admins can also create **custom titles** for their condominium.

A user can hold a functional title independently of their system role. For example, a `user` can be listed as a Councilor.

---

## 4. Multi-Tenancy Architecture

- Each condominium is a row in a `condominiums` table
- All data tables include a `condominium_id` foreign key
- Supabase Row Level Security (RLS) enforces data isolation at the database level — users can only query rows belonging to their condominium
- Auth is handled via Supabase Auth (Google OAuth + other providers available in Supabase)
- A user can theoretically belong to multiple condominiums (e.g. owns apartments in two buildings); their role is stored per-condominium in a `condominium_members` junction table

---

## 5. Authentication

- Provided by **Supabase Auth**
- Supported: Email
- After first sign-in, users are in a pending state until an admin adds them to a condominium workspace and assigns their role
- Invitations: Admin can invite users by email; invited users receive a link and sign in via their email

---

## 6. Features

### 6.1 Home Page / Dashboard

The landing page for authenticated users within their condominium workspace. Contains:

- Condominium name, logo, and description
- Navigation cards linking to:
  - Yearly Budget Plan
  - Projects
  - Condominium Administration (people & titles)
  - Documents
  - Initiatives
  - Ballots / Voting
  - Maintenance Requests
  - Announcements
- Recent activity feed (latest announcements, open votes, newly approved initiatives)
- In-app notification bell (see Section 10)

---

### 6.2 Yearly Budget Plan

- A single approved budget document per year per condominium
- Structured as line-item categories (e.g. Maintenance, Utilities, Administration Fees, Reserve Fund)
- Each line item has: category name, planned amount, notes
- **Read-only for all users** once published
- Admin can draft, edit, and publish the budget for a given year
- Previous years' budgets are archived and accessible
- Budget is not linked to actual payment tracking (out of scope)

---

### 6.3 Projects

A project tracks a physical or administrative initiative that has been formally approved and is being executed.

**Lifecycle:** `Proposed → Approved → In Progress → Completed → Archived`

**Fields:**
- Title, description, category (e.g. Infrastructure, Landscaping, Legal)
- Estimated cost, actual cost (editable by admin)
- Start date, expected end date, actual end date
- Status (above lifecycle)
- Assigned responsible person (functional title holder or free text)
- Attached documents (links to Document Repository)
- Progress updates (admin posts updates; visible to all)

**Permissions:**
- All users: view approved/in-progress/completed projects
- Admin: create, edit, update status, post progress updates

---

### 6.4 Condominium Administration Page

A public-facing page listing the people who govern the condominium.

**Displays:**
- Each person's name, profile photo, functional title, and optional contact info
- Ordered by title hierarchy (President first, then Administrator, Councilor, Accountant, custom)

**Managed by:** Admin — they assign functional titles to existing condominium members.

---

### 6.5 Initiatives

Residents and admins can propose initiatives — ideas or requests that may eventually become projects or voting subjects.

**Lifecycle:** `Draft → Pending Review → Approved → Rejected → Converted`

- Any authenticated user (any system role) can submit an initiative
- Initiatives remain private (visible only to submitter and admins) until approved
- Admin can approve, reject (with a reason), or convert an initiative directly into a Project or Ballot
- Approved initiatives are visible to all condominium members
- Submitter is notified of status changes

**Fields:**
- Title, description, category
- Supporting documents (optional file attachments)
- Submitter (linked to user account)
- Admin notes / rejection reason

---

### 6.6 Ballots & Voting

Admins (and super-admins) can create digital ballot papers for resident voting.

**Ballot fields:**
- Title and description
- Question type: Yes/No, Multiple Choice (single answer), Multiple Choice (multiple answers)
- Options list (for multiple choice)
- Open date / Close date
- Quorum threshold (optional — minimum % of eligible voters required for result to be valid)
- Linked initiative or project (optional)
- Visibility: all condominium members

**Voting:**
- Each eligible voter (all `user` and `admin` role members of the condominium) can vote once
- Votes are **tied to identity** — admin can see who voted for what (for audit and quorum purposes)
- Voters can see whether they have already voted, but cannot change their vote
- Real-time or on-close result tallying

**Results:**
- After closing, results are visible to all members
- If quorum was not met, the ballot is marked as invalid and noted as such
- Admin can export results (CSV)

**Lifecycle:** `Draft → Open → Closed → Results Published`

---

### 6.7 Document Repository

A hierarchical folder structure for storing and sharing files within the condominium.

**Storage backend:** Supabase Storage

**Structure:**
- Admin creates folders and subfolders
- Files are uploaded to folders
- Each folder has a **default visibility role** (which system roles can see it)
- Individual files can **override** the parent folder's visibility (more restrictive or more permissive)

**Visibility levels (assignable to folder or file):**
- `admin-only` — only admins and super-admins
- `all-members` — all condominium members (users + admins)
- `public` — visible without authentication (for public-facing documents like regulations)

**Permissions:**
- Admin: create/edit/delete folders and files, set permissions
- User: view and download files they have access to; cannot upload or delete

**Supported file types:** PDF, DOCX, XLSX, images, and common document formats.

---

### 6.8 Announcements

Admin can publish announcements to all condominium members.

**Fields:**
- Title, body (rich text)
- Optional attached files
- Pinned (pinned announcements appear at top of dashboard)
- Published date

**Visibility:** All condominium members. Announcements are read-only for users.

When an announcement is published, a notification is sent to all members (email + in-app).

---

### 6.9 Maintenance Requests

Residents submit maintenance or repair requests to the administration.

**Fields:**
- Title, description
- Category (e.g. Plumbing, Electrical, Common Areas, Elevator)
- Location within building (free text or dropdown of common areas)
- Priority: Low / Medium / High (set by submitter, adjustable by admin)
- Photo attachments (optional)
- Status: `Open → In Review → In Progress → Resolved → Closed`
- Admin notes / resolution description

**Permissions:**
- User: submit new requests, view their own requests and status updates
- Admin: view all requests, update status, add notes

Submitter is notified on status changes.

---

### 6.10 Units & Ownership

Each condominium has a register of units (apartments).

**Unit fields:**
- Unit number / identifier
- Floor, building section (optional)
- Area in m² (used for ownership share calculation)
- Ownership share % (can be entered manually or auto-calculated from area)
- Linked owner(s) — linked to user accounts or stored as unregistered owner records

**Ownership share** is used as metadata for weighted voting (optional per ballot) and for display purposes. It does not affect system permissions.

Admin manages the unit register. Users can view their own unit details.

---

## 7. Data Model (High-Level)

```
condominiums
  id, name, logo_url, address, description, created_at

condominium_members
  id, condominium_id, user_id, system_role (admin|user), functional_title_id, joined_at

functional_titles
  id, condominium_id, name, sort_order

units
  id, condominium_id, unit_number, floor, area_m2, ownership_share_pct

unit_owners
  id, unit_id, user_id (nullable), owner_name, owner_email

budget_plans
  id, condominium_id, year, status (draft|published), published_at

budget_line_items
  id, budget_plan_id, category, amount, notes

projects
  id, condominium_id, title, description, category, status, estimated_cost,
  actual_cost, start_date, end_date, responsible_person, created_by

project_updates
  id, project_id, body, created_by, created_at

initiatives
  id, condominium_id, title, description, category, status, submitter_id,
  admin_notes, created_at

ballots
  id, condominium_id, title, description, question_type, options (jsonb),
  open_at, close_at, quorum_pct, linked_initiative_id, status, created_by

votes
  id, ballot_id, voter_id, selected_options (jsonb), voted_at

documents
  id, condominium_id, folder_id (nullable), name, storage_path,
  visibility_override (nullable), uploaded_by, created_at

document_folders
  id, condominium_id, parent_folder_id (nullable), name, default_visibility

announcements
  id, condominium_id, title, body, pinned, published_at, created_by

maintenance_requests
  id, condominium_id, submitter_id, title, description, category,
  location, priority, status, admin_notes, created_at

notifications
  id, user_id, condominium_id, type, title, body, read, link_url, created_at

audit_logs
  id, condominium_id, actor_id, action, entity_type, entity_id,
  metadata (jsonb), created_at
```

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui |
| Backend / DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth through Email |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime (for in-app notifications, live ballot results) |
| Workflow Automation | n8n (email notifications, scheduled jobs, webhook triggers) |
| Email | n8n → SMTP or transactional email provider (SendGrid / Resend) |
| Hosting | Vercel (frontend) + Hetzner (n8n) |

---

## 9. Supabase Architecture Details

### Row Level Security

Every table with `condominium_id` has RLS policies enforcing:
- Users can only SELECT rows where `condominium_id` matches their membership
- Write operations are restricted to `admin` or `super-admin` roles as appropriate

### Edge Functions

Used for:
- Sending invitation emails
- Triggering n8n webhooks on specific events (e.g. new initiative submitted, ballot opened)
- Handling OAuth callback and post-signup user provisioning

### Storage Buckets

- `documents` — condominium documents (access controlled via RLS + signed URLs)
- `avatars` — user profile photos
- `initiative-attachments` — files attached to initiatives
- `maintenance-attachments` — photos attached to maintenance requests
- `announcement-attachments` — files attached to announcements

---

## 10. Notifications

### In-App
- Bell icon in navbar showing unread count
- Notification dropdown with title, short body, timestamp, and a link to the relevant page
- Stored in `notifications` table; delivered via Supabase Realtime

### Email
- Triggered via n8n workflows listening to Supabase webhooks or scheduled runs
- Templates for:
  - Invitation to join condominium
  - Initiative status changed (approved / rejected)
  - New ballot opened
  - Ballot closing reminder (24h before)
  - Ballot results published
  - Maintenance request status changed
  - New announcement published

---

## 11. Audit Log

All significant actions are logged to `audit_logs`:

- User invited / joined / removed
- System role changed
- Functional title assigned
- Budget published
- Project created / status changed
- Initiative approved / rejected / converted
- Ballot created / opened / closed
- Vote cast (voter_id + ballot_id recorded)
- Document uploaded / deleted / permissions changed
- Announcement published
- Maintenance request status changed

Admin can view the audit log filtered by date, actor, or entity type. Super-admin can view across all condominiums.

---

## 12. n8n Workflows

n8n handles asynchronous and scheduled tasks:

| Workflow | Trigger | Action |
|---|---|---|
| Send invitation email | Supabase webhook: new invitation row | Send email with invite link |
| Notify on initiative status change | Webhook: initiative status updated | Email + in-app notification to submitter |
| Notify on new ballot | Webhook: ballot status → open | Email all condominium members |
| Ballot closing reminder | Scheduled: daily | Email voters who haven't voted, 24h before close |
| Notify on ballot results | Webhook: ballot status → closed | Email all members with results link |
| Notify on maintenance update | Webhook: request status updated | Email submitter |
| Notify on announcement | Webhook: announcement published | Email all members |

---

## 13. Pages & Routes

```
/                          → Marketing / login page
/auth/callback             → OAuth callback handler

/app/[condominiumSlug]/
  dashboard                → Home page with nav cards + activity feed
  budget/[year]            → Yearly budget plan (read-only)
  budget/[year]/edit       → Budget editor (admin only)
  projects                 → Project list
  projects/[id]            → Project detail + updates
  projects/new             → Create project (admin only)
  administration           → Governance team page
  initiatives              → Initiative list (approved ones visible to all)
  initiatives/new          → Submit initiative (any role)
  initiatives/[id]         → Initiative detail
  initiatives/review       → Pending initiatives (admin only)
  ballots                  → Ballot list
  ballots/new              → Create ballot (admin only)
  ballots/[id]             → Ballot detail + voting interface
  ballots/[id]/results     → Results page
  documents                → Document repository
  documents/[folderId]     → Folder contents
  announcements            → Announcement feed
  announcements/[id]       → Single announcement
  announcements/new        → Create announcement (admin only)
  maintenance              → Maintenance request list
  maintenance/new          → Submit request (any role)
  maintenance/[id]         → Request detail
  settings/
    general                → Condominium name, logo, address
    members                → User management, invitations, role assignment
    titles                 → Manage functional titles
    units                  → Unit register & ownership
    notifications          → Notification preferences

/super-admin/
  condominiums             → List all condominiums
  condominiums/new         → Create condominium workspace
  condominiums/[id]        → Condominium detail + admin management
  audit-log                → Platform-wide audit log
```

---

## 14. Out of Scope (v1)

- Fee / payment tracking or bank integration
- Subscription / billing management (Stripe)
- Native mobile app (responsive web only)
- Offline support
- Multi-language i18n (can be added later)
- Video or real-time meeting features
