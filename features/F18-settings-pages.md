# F18 — Settings Pages

**Status:** `completed`
**Branch:** `claude/build-claude-settings-pages-BCKrF`
**Spec sections:** §13 Routes (/settings/*), §6.1 (general settings)

---

## Context

Settings pages are under `/app/[condominiumSlug]/settings/`. Most are admin-only. This feature covers the remaining settings surfaces not already built in other features: General (condominium info), User Profile, and the shared settings shell/navigation.

**Key files to read before starting:**
- `CLAUDE.md` — planned settings route structure
- `features/F03-multitenancy-condominium.md` — condominium data model
- `features/F04-user-roles-members.md` — members settings (already scoped there)
- `features/F14-units-ownership.md` — units settings (already scoped there)
- `features/F15-notifications.md` — notification preferences (already scoped there)
- `docs/condominium-platform-spec.md` §13

---

## Tasks

### Settings Shell
- [x] Create `app/app/[condominiumSlug]/settings/layout.tsx`:
  - Side navigation menu with links to all settings sections:
    - General (admin only)
    - Members (→ F04, admin only)
    - Titles (→ F04, admin only)
    - Units (→ F14, admin only)
    - Audit Log (→ F16, admin only)
    - Profile (all users)
  - Fetches user role; shows admin-only nav items only to admins
  - Requires authentication and active membership

### General Settings Page
- [x] Create `app/app/[condominiumSlug]/settings/general/page.tsx`:
  - Edit condominium name
  - Edit address
  - Edit description
  - Upload/change logo (to `avatars` Supabase Storage bucket)
  - Slug display (read-only — slug changes break URLs, so not editable after creation)
  - Save button with success/error feedback
- [x] Server actions in `settings/general/actions.ts`:
  - `updateCondominiumInfo(slug, { name, address, description })` — updates `condominiums` row
  - `updateCondominiumLogo(slug, formData)` — uploads to Storage, updates `logo_url`
- [x] Client form component `settings/general/general-settings-form.tsx`

### User Profile Settings
- [x] Create `app/app/[condominiumSlug]/settings/profile/page.tsx`:
  - For any authenticated member (not admin-only)
  - Edit display name
  - Upload profile photo (to `avatars` bucket, path: `profiles/{userId}/avatar.{ext}`)
  - Email shown read-only (managed by Google OAuth)
- [x] Server actions in `settings/profile/actions.ts`:
  - `updateProfile({ full_name })` — updates `profiles` row
  - `uploadAvatar(formData)` — uploads to `avatars` bucket, updates `profiles.avatar_url`
- [x] Client form component `settings/profile/profile-form.tsx`

### Settings Index Redirect
- [x] `app/app/[condominiumSlug]/settings/page.tsx` → redirects admins to `/settings/general`, non-admins to `/settings/profile`

### Cross-Feature Settings Linking
These pages are built in their respective features and appear in settings navigation:
- [x] Members page (F04) accessible at `settings/members`
- [x] Titles page (F04) accessible at `settings/titles`
- [x] Units page (F14) accessible at `settings/units`
- [x] Audit Log (F16) accessible at `settings/audit-log`
- [ ] Notifications preferences (F15) — `settings/notifications` deferred; F15 built `/notifications` inbox only

### Navbar Updates
- [x] "Profile" dropdown link updated to `settings/profile` (all users)
- [x] "Settings" dropdown link shown only to admins, links to `settings/general`

---

## New Files Added

- `app/app/[condominiumSlug]/settings/layout.tsx` — settings shell with SettingsNav sidebar
- `app/app/[condominiumSlug]/settings/page.tsx` — role-aware redirect
- `app/app/[condominiumSlug]/settings/general/page.tsx` — general settings page (admin only)
- `app/app/[condominiumSlug]/settings/general/actions.ts` — updateCondominiumInfo, updateCondominiumLogo
- `app/app/[condominiumSlug]/settings/general/general-settings-form.tsx` — client form
- `app/app/[condominiumSlug]/settings/profile/page.tsx` — profile settings page (all users)
- `app/app/[condominiumSlug]/settings/profile/actions.ts` — updateProfile, uploadAvatar
- `app/app/[condominiumSlug]/settings/profile/profile-form.tsx` — client form
- `components/settings/settings-nav.tsx` — sidebar nav client component

---

## Definition of Done

- [x] Settings shell renders with correct sidebar navigation and active state
- [x] General settings page allows editing condominium name, address, description, and logo
- [x] Non-admins see only Profile in the sidebar; admin-only pages redirect non-admins to dashboard
- [x] All built settings sub-pages are linked and accessible from the sidebar
- [x] Logo upload works and updated logo appears in navbar and dashboard
- [x] Profile page allows any member to update display name and avatar photo
- [x] Build passes cleanly (`npx next build`)

---

## Notes

- Logo URL stored in `condominiums.logo_url`; served from Supabase Storage `avatars` bucket at path `condominiums/{id}/logo.{ext}`
- Profile photo URL stored in `profiles.avatar_url`; served from `avatars` bucket at path `profiles/{userId}/avatar.{ext}`
- Slug is NOT editable after creation — UI shows a read-only field with explanatory note
- `settings/notifications` deferred — F15 built the notifications inbox but not a preferences/toggle page
