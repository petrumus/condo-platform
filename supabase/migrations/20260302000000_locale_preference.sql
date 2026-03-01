-- Add preferred_locale column to profiles
-- Stores the user's preferred UI language: 'ro' (Romanian, default) or 'ru' (Russian)

alter table public.profiles
  add column if not exists preferred_locale text not null default 'ro'
  check (preferred_locale in ('ro', 'ru'));

comment on column public.profiles.preferred_locale is
  'User preferred UI language. ro = Romanian (default), ru = Russian.';
