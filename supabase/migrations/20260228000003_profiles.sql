-- F04: Profiles table — mirrors auth.users for public querying
-- Allows condominium members to see each other's display name and avatar.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can view profiles of members in the same condominium
create policy "Members can view profiles in their condominium"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.condominium_members cm1
      join public.condominium_members cm2
        on cm1.condominium_id = cm2.condominium_id
      where cm1.user_id = auth.uid()
        and cm2.user_id = profiles.id
    )
  );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Super-admins have full access
create policy "Super-admins have full access to profiles"
  on public.profiles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ─── Sync trigger ─────────────────────────────────────────────────────────────
-- Automatically create/update a profile row when a user signs up or updates.

create or replace function public.handle_user_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_user_profile();

-- Backfill existing auth users into profiles
insert into public.profiles (id, email, full_name, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
