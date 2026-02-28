# F18 — Settings Pages

**Status:** `pending`
**Branch:** `claude/feature-settings-pages`
**Spec sections:** §13 Routes (/settings/*), §6.1 (general settings)

---

## Context

Settings pages are under `/app/[condominiumSlug]/settings/`. Most are admin-only. This feature covers the remaining settings surfaces not already built in other features: General (condominium info), and the shared settings shell/navigation.

**Key files to read before starting:**
- `CLAUDE.md` — planned settings route structure
- `features/F03-multitenancy-condominium.md` — condominium data model
- `features/F04-user-roles-members.md` — members settings (already scoped there)
- `features/F14-units-ownership.md` — units settings (already scoped there)
- `features/F15-notifications.md` — notification preferences (already scoped there)
- `condominium-platform-spec.md` §13

---

## Tasks

### Settings Shell
- [ ] Create `app/app/[condominiumSlug]/settings/layout.tsx`:
  - Side navigation menu with links to all settings sections:
    - General
    - Members (→ F04)
    - Titles (→ F04)
    - Units (→ F14)
    - Notifications (→ F15)
    - Audit Log (→ F16)
  - Admin-only layout: redirect non-admins away
  - Highlight active section in sidebar

### General Settings Page
- [ ] Create `app/app/[condominiumSlug]/settings/general/page.tsx`:
  - Edit condominium name
  - Edit address
  - Edit description
  - Upload/change logo (to `avatars` Supabase Storage bucket)
  - Slug display (read-only — slug changes break URLs, so not editable after creation)
  - Save button with success/error feedback
- [ ] Server actions in `settings/general/actions.ts`:
  - `updateCondominiumInfo(id, { name, address, description })` — updates `condominiums` row
  - `updateCondominiumLogo(id, file)` — uploads to Storage, updates `logo_url`

### User Profile Settings
- [ ] Create `app/app/[condominiumSlug]/settings/profile/page.tsx` (optional, or at `/profile`):
  - For any authenticated user (not admin-only)
  - Edit display name
  - Upload profile photo (to `avatars` bucket)
  - Change email (via Supabase Auth `updateUser`)
  - Change password (only for email auth users)
- [ ] Server actions: `updateProfile(data)`, `uploadAvatar(file)`

### Settings Index Redirect
- [ ] `app/app/[condominiumSlug]/settings/page.tsx` → redirect to `/settings/general`

### Cross-Feature Settings Linking
These pages are built in their respective features but must appear in settings navigation:
- [ ] Verify Members page (F04) is accessible at `settings/members`
- [ ] Verify Titles page (F04) is accessible at `settings/titles`
- [ ] Verify Units page (F14) is accessible at `settings/units`
- [ ] Verify Notifications preferences (F15) is accessible at `settings/notifications`
- [ ] Verify Audit Log (F16) is accessible at `settings/audit-log`

---

## Definition of Done

- Settings shell renders with correct sidebar navigation and active state
- General settings page allows editing condominium name, address, description, and logo
- Non-admins are redirected away from admin settings pages
- All settings sub-pages are linked and accessible from the sidebar
- Logo upload works and updated logo appears in navbar and dashboard

---

## Notes

- Logo URL stored in `condominiums.logo_url`; served from Supabase Storage `avatars` bucket
- Profile photo URL stored in user metadata or a separate `profiles` table (decide in F01/F02)
- Slug is NOT editable after creation — explain this in the UI with a tooltip or note
- Consider adding a `profiles` table in F01 to store display_name, avatar_url per user (separate from auth.users)
