# F19 — Multi-Language Support (Romanian + Russian)

**Status:** `in_progress`
**Branch:** `claude/multi-language-support-plan-SA1ca`
**Migration:** `supabase/migrations/20260302000000_locale_preference.sql`

---

## Context

All UI text was previously hardcoded in English (~215+ strings across ~50+ files). This feature adds Romanian (default) and Russian language support using `next-intl` v4, with a language switcher in the navbar and the user's preference persisted in the database.

**Approach:** Cookie-based locale detection (no URL restructuring). Locale stored in `NEXT_LOCALE` cookie (1-year expiry). Default locale: `ro`. User preference also synced to `profiles.preferred_locale`.

**Key files to read before continuing:**
- `i18n/request.ts` — core next-intl config
- `messages/ro.json` — Romanian translations (source of truth for key structure)
- `messages/ru.json` — Russian translations
- `app/actions/set-locale.ts` — server action to set cookie + sync DB

---

## Infrastructure (Completed)

- [x] Install `next-intl` v4 (`npm install next-intl`)
- [x] Create `i18n/request.ts` — reads `NEXT_LOCALE` cookie, falls back to `ro`
- [x] Update `next.config.ts` — wrapped with `createNextIntlPlugin("./i18n/request.ts")`
- [x] Update `app/layout.tsx` — added `NextIntlClientProvider`, `lang={locale}` on `<html>`
- [x] Create `messages/ro.json` — ~215 Romanian translation keys across all namespaces
- [x] Create `messages/ru.json` — same key structure, Russian translations
- [x] Create `components/language-switcher.tsx` — Globe icon dropdown (Română / Русский)
- [x] Create `app/actions/set-locale.ts` — sets cookie + updates `profiles.preferred_locale`
- [x] Create `supabase/migrations/20260302000000_locale_preference.sql` — adds `preferred_locale` column to profiles
- [x] Update `lib/types/database.ts` — added `preferred_locale: string` to profiles types

---

## Translation Namespaces

```
nav              — navbar links + user dropdown
common           — save, cancel, delete, edit, back, loading…
errors           — generic and validation error messages
languageSwitcher — label, ro, ru
login            — login page (title, subtitle, button, footer links)
pending          — no-membership page
suspended        — suspended condominium page
picker           — condominium picker page (multi-membership users)
invite           — invitation acceptance page
dashboard        — section headings, nav card titles/descriptions, activityTypes, closes
notifications    — bell dropdown (heading, markAll, empty, timeAgo strings)
notificationsPage — full notifications page
announcements    — list/detail page strings (title, new, pinned, empty, back)
projects         — list page, status tabs (tabs.all, tabs.proposed, etc.), new, empty
initiatives      — list page, status tabs, new, empty
ballots          — list page, status tabs, new, empty
documents        — list page, folders, empty, upload
budget           — budget page strings
maintenance      — list page, status tabs, new, empty
administration   — governance team page
settings         — settings nav, general/profile page labels
superAdmin       — super-admin panel strings
```

---

## Files Translated (Completed)

### Infrastructure & Layout
- [x] `app/layout.tsx` — `NextIntlClientProvider`, `lang={locale}`
- [x] `components/layout/navbar.tsx` — NAV_LINKS, user dropdown, `<LanguageSwitcher />`
- [x] `components/settings/settings-nav.tsx` — nav item labels, "Settings" heading

### Auth & Entry Pages
- [x] `app/page.tsx` — login page (`login` namespace)
- [x] `app/pending/page.tsx` — pending page (`pending` namespace)
- [x] `app/suspended/page.tsx` — suspended page (`suspended` namespace)
- [x] `app/app/page.tsx` — condominium picker (`picker` namespace)
- [x] `app/invite/[token]/page.tsx` — invitation page (`invite` namespace)

### Dashboard & Activity
- [x] `app/app/[condominiumSlug]/dashboard/page.tsx` — nav cards, section headings, date locale
- [x] `components/dashboard/activity-feed.tsx` — TYPE_LABELS, empty state

### Notifications Bell
- [x] `components/notifications/notification-bell.tsx` — timeAgo strings, heading, markAll button

### Feature List Pages
- [x] `app/app/[condominiumSlug]/announcements/page.tsx` — title, new button, empty state
- [x] `app/app/[condominiumSlug]/projects/page.tsx` — title, tabs, new button, empty state

### Settings
- [x] `app/app/[condominiumSlug]/settings/profile/page.tsx` — profile labels + `<LanguageSwitcher>` card

---

## Files Still Needing Translation

### Announcements
- [ ] `app/app/[condominiumSlug]/announcements/new/page.tsx`
- [ ] `app/app/[condominiumSlug]/announcements/[id]/page.tsx`
- [ ] `app/app/[condominiumSlug]/announcements/[id]/edit/page.tsx`
- [ ] `components/announcements/announcement-card.tsx`
- [ ] `components/announcements/announcement-form.tsx`
- [ ] `components/announcements/pin-button.tsx`
- [ ] `components/announcements/delete-announcement-button.tsx`
- [ ] `components/announcements/delete-attachment-button.tsx`
- [ ] `components/announcements/attachment-download-button.tsx`

### Projects
- [ ] `app/app/[condominiumSlug]/projects/new/page.tsx`
- [ ] `app/app/[condominiumSlug]/projects/[id]/page.tsx`
- [ ] `app/app/[condominiumSlug]/projects/[id]/edit/page.tsx`
- [ ] `components/projects/status-badge.tsx`
- [ ] `components/projects/project-card.tsx`
- [ ] `components/projects/project-update-item.tsx`
- [ ] `components/projects/project-form.tsx`
- [ ] `components/projects/post-update-form.tsx`
- [ ] `components/projects/change-status-form.tsx`

### Budget
- [ ] `app/app/[condominiumSlug]/budget/[year]/page.tsx`
- [ ] `app/app/[condominiumSlug]/budget/[year]/edit/page.tsx`
- [ ] `components/budget/budget-table.tsx`
- [ ] `components/budget/budget-editor.tsx`
- [ ] `components/budget/year-selector.tsx`

### Initiatives
- [ ] `app/app/[condominiumSlug]/initiatives/page.tsx`
- [ ] `app/app/[condominiumSlug]/initiatives/new/page.tsx`
- [ ] `app/app/[condominiumSlug]/initiatives/review/page.tsx`
- [ ] `app/app/[condominiumSlug]/initiatives/[id]/page.tsx`
- [ ] `components/initiatives/initiative-status-badge.tsx`
- [ ] `components/initiatives/initiative-card.tsx`
- [ ] `components/initiatives/initiative-form.tsx`
- [ ] `components/initiatives/admin-initiative-actions.tsx`

### Ballots
- [ ] `app/app/[condominiumSlug]/ballots/page.tsx`
- [ ] `app/app/[condominiumSlug]/ballots/new/page.tsx`
- [ ] `app/app/[condominiumSlug]/ballots/[id]/page.tsx`
- [ ] `app/app/[condominiumSlug]/ballots/[id]/edit/page.tsx`
- [ ] `app/app/[condominiumSlug]/ballots/[id]/results/page.tsx`
- [ ] `components/ballots/ballot-status-badge.tsx`
- [ ] `components/ballots/ballot-card.tsx`
- [ ] `components/ballots/ballot-form.tsx`
- [ ] `components/ballots/vote-form.tsx`
- [ ] `components/ballots/ballot-admin-actions.tsx`
- [ ] `components/ballots/export-csv-button.tsx`

### Documents
- [ ] `app/app/[condominiumSlug]/documents/page.tsx`
- [ ] `app/app/[condominiumSlug]/documents/[folderId]/page.tsx`
- [ ] `components/documents/visibility-badge.tsx`
- [ ] `components/documents/folder-card.tsx`
- [ ] `components/documents/document-row.tsx`
- [ ] `components/documents/folder-manager.tsx`
- [ ] `components/documents/folder-content-manager.tsx`
- [ ] `components/documents/new-folder-dialog.tsx`
- [ ] `components/documents/upload-file-dialog.tsx`
- [ ] `components/documents/edit-item-dialog.tsx`

### Maintenance
- [ ] `app/app/[condominiumSlug]/maintenance/page.tsx`
- [ ] `app/app/[condominiumSlug]/maintenance/new/page.tsx`
- [ ] `app/app/[condominiumSlug]/maintenance/[id]/page.tsx`
- [ ] `components/maintenance/maintenance-status-badge.tsx`
- [ ] `components/maintenance/maintenance-priority-badge.tsx`
- [ ] `components/maintenance/maintenance-request-card.tsx`
- [ ] `components/maintenance/maintenance-request-form.tsx`
- [ ] `components/maintenance/admin-maintenance-actions.tsx`
- [ ] `components/maintenance/photo-gallery.tsx`

### Notifications Page
- [ ] `app/app/[condominiumSlug]/notifications/page.tsx`

### Administration
- [ ] `app/app/[condominiumSlug]/administration/page.tsx`

### Settings Sub-pages
- [ ] `app/app/[condominiumSlug]/settings/general/page.tsx`
- [ ] `app/app/[condominiumSlug]/settings/general/general-settings-form.tsx`
- [ ] `app/app/[condominiumSlug]/settings/members/page.tsx`
- [ ] `app/app/[condominiumSlug]/settings/titles/page.tsx`
- [ ] `app/app/[condominiumSlug]/settings/audit-log/page.tsx`
- [ ] `app/app/[condominiumSlug]/settings/units/page.tsx`
- [ ] `app/app/[condominiumSlug]/settings/units/my-unit/page.tsx`
- [ ] `components/settings/units/unit-dialog.tsx`
- [ ] `components/settings/units/unit-owners-dialog.tsx`
- [ ] `components/settings/units/units-table.tsx`

### Super Admin Panel
- [ ] `app/super-admin/condominiums/page.tsx`
- [ ] `app/super-admin/condominiums/new/page.tsx`
- [ ] `app/super-admin/condominiums/new/create-condominium-form.tsx`
- [ ] `app/super-admin/condominiums/[id]/page.tsx`
- [ ] `app/super-admin/condominiums/[id]/edit-condominium-form.tsx`
- [ ] `app/super-admin/condominiums/[id]/invite-admin-form.tsx`
- [ ] `app/super-admin/condominiums/[id]/member-row.tsx`
- [ ] `app/super-admin/condominiums/[id]/danger-zone.tsx`
- [ ] `app/super-admin/condominiums/condominium-row-actions.tsx`
- [ ] `app/super-admin/audit-log/page.tsx`

### Server Action Error Messages
Replace hardcoded English error strings with `getTranslations('errors')` in:
- [ ] `app/app/[condominiumSlug]/budget/actions.ts`
- [ ] `app/app/[condominiumSlug]/projects/actions.ts`
- [ ] `app/app/[condominiumSlug]/announcements/actions.ts`
- [ ] `app/app/[condominiumSlug]/ballots/actions.ts`
- [ ] `app/app/[condominiumSlug]/documents/actions.ts`
- [ ] `app/app/[condominiumSlug]/initiatives/actions.ts`
- [ ] `app/app/[condominiumSlug]/maintenance/actions.ts`
- [ ] `app/app/[condominiumSlug]/notifications/actions.ts`
- [ ] `app/app/[condominiumSlug]/settings/units/actions.ts`
- [ ] `app/app/[condominiumSlug]/settings/general/actions.ts`
- [ ] `app/app/[condominiumSlug]/settings/profile/actions.ts`
- [ ] `app/super-admin/condominiums/actions.ts`
- [ ] `app/invite/[token]/actions.ts`

### Date Formatting
Replace `toLocaleDateString("en-US", ...)` with locale-aware formatting in any remaining pages:
- Use `const locale = await getLocale()` then `dateLocale = locale === "ru" ? "ru-RU" : "ro-RO"`
- Already done in `dashboard/page.tsx`; check remaining pages that call `toLocaleDateString`

---

## How to Translate a File

### Server component (async page or layout)
```tsx
import { getTranslations } from "next-intl/server"

export default async function MyPage() {
  const t = await getTranslations("myNamespace")
  return <h1>{t("title")}</h1>
}
```

### Client component
```tsx
"use client"
import { useTranslations } from "next-intl"

export function MyComponent() {
  const t = useTranslations("myNamespace")
  return <button>{t("save")}</button>
}
```

### Server action (error messages)
```ts
"use server"
import { getTranslations } from "next-intl/server"

export async function myAction() {
  const t = await getTranslations("errors")
  if (!title) throw new Error(t("titleRequired"))
}
```

### Adding new translation keys
1. Add the key to `messages/ro.json` (Romanian — source of truth)
2. Add the same key to `messages/ru.json` (Russian translation)
3. Use `t("keyName")` in the component

---

## Database Migration

**File:** `supabase/migrations/20260302000000_locale_preference.sql`

```sql
alter table public.profiles
  add column if not exists preferred_locale text not null default 'ro'
  check (preferred_locale in ('ro', 'ru'));
```

Applied manually via Supabase Dashboard SQL editor (Supabase CLI not installed on Windows).

---

## New Files Added

| File | Purpose |
|---|---|
| `i18n/request.ts` | next-intl server config — reads `NEXT_LOCALE` cookie, falls back to `ro` |
| `messages/ro.json` | Romanian translations (~215 keys, all namespaces) |
| `messages/ru.json` | Russian translations (same key structure) |
| `components/language-switcher.tsx` | Globe icon dropdown (Română / Русский) |
| `app/actions/set-locale.ts` | Server action: sets cookie + updates `profiles.preferred_locale` |
| `supabase/migrations/20260302000000_locale_preference.sql` | DB migration for `preferred_locale` column |

---

## Modified Files

| File | Change |
|---|---|
| `package.json` | Added `next-intl ^4.8.3` |
| `next.config.ts` | Wrapped with `createNextIntlPlugin` |
| `app/layout.tsx` | Added `NextIntlClientProvider`, `lang={locale}` |
| `lib/types/database.ts` | Added `preferred_locale` to profiles Row/Insert/Update types |
| `components/layout/navbar.tsx` | Translated NAV_LINKS + added `<LanguageSwitcher>` |
| `components/settings/settings-nav.tsx` | Translated nav item labels |
| `components/dashboard/activity-feed.tsx` | Added `"use client"`, translated TYPE_LABELS + empty state |
| `components/notifications/notification-bell.tsx` | Translated timeAgo strings, heading, markAll |
| `app/page.tsx` | Translated all login page text |
| `app/pending/page.tsx` | Translated all pending page text |
| `app/suspended/page.tsx` | Made async, translated all text |
| `app/app/page.tsx` | Translated condominium picker text |
| `app/invite/[token]/page.tsx` | Translated invitation page text |
| `app/app/[condominiumSlug]/dashboard/page.tsx` | Translated nav cards, section headings, locale-aware dates |
| `app/app/[condominiumSlug]/announcements/page.tsx` | Translated title, new button, empty state |
| `app/app/[condominiumSlug]/projects/page.tsx` | Translated title, status tabs, new button, empty state |
| `app/app/[condominiumSlug]/settings/profile/page.tsx` | Translated profile labels, added `<LanguageSwitcher>` card |

---

## Definition of Done

- [x] `npm install next-intl` — no errors
- [x] `npx next build` — clean build
- [x] Language switcher appears in navbar and profile settings
- [x] Switching language updates all translated strings immediately
- [x] Cookie persists across page refreshes
- [x] DB `preferred_locale` column updated when user switches language
- [ ] All remaining ~60 files above have hardcoded strings replaced with `t()` calls
- [ ] Both `messages/ro.json` and `messages/ru.json` contain keys for all translated strings
- [ ] Server actions return localized error messages
- [ ] Date formatting is locale-aware in all pages

---

## Adding a Third Language (Future)

1. Add locale code to `SUPPORTED_LOCALES` in `i18n/request.ts` and `app/actions/set-locale.ts`
2. Add the locale code to the `check` constraint in a new DB migration for `profiles.preferred_locale`
3. Create `messages/<locale>.json` with the same key structure
4. Add a new `<DropdownMenuItem>` to `components/language-switcher.tsx`
5. Update `app/layout.tsx` `<html lang>` mapping if needed
