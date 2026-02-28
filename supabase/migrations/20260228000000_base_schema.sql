-- F01/F02: Base schema — core tables required for auth and multi-tenancy
-- Run this before any other migrations.

-- ─── condominiums ────────────────────────────────────────────────────────────

create table if not exists public.condominiums (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  address     text,
  description text,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.condominiums enable row level security;

-- Members can read condominiums they belong to
create policy "Members can view their condominium"
  on public.condominiums for select
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = condominiums.id
        and condominium_members.user_id = auth.uid()
    )
  );

-- Admins can update their condominium
create policy "Admins can update their condominium"
  on public.condominiums for update
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = condominiums.id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- ─── functional_titles ───────────────────────────────────────────────────────

create table if not exists public.functional_titles (
  id              uuid primary key default gen_random_uuid(),
  condominium_id  uuid not null references public.condominiums(id) on delete cascade,
  name            text not null,
  sort_order      integer not null default 0
);

alter table public.functional_titles enable row level security;

-- Members can view titles for their condominium
create policy "Members can view functional titles"
  on public.functional_titles for select
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = functional_titles.condominium_id
        and condominium_members.user_id = auth.uid()
    )
  );

-- Admins can manage titles
create policy "Admins can manage functional titles"
  on public.functional_titles for all
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = functional_titles.condominium_id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- ─── condominium_members ─────────────────────────────────────────────────────

create table if not exists public.condominium_members (
  id                   uuid primary key default gen_random_uuid(),
  condominium_id       uuid not null references public.condominiums(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  system_role          text not null default 'user' check (system_role in ('admin', 'user')),
  functional_title_id  uuid references public.functional_titles(id) on delete set null,
  joined_at            timestamptz not null default now(),
  unique (condominium_id, user_id)
);

create index on public.condominium_members (condominium_id);
create index on public.condominium_members (user_id);

alter table public.condominium_members enable row level security;

-- Members can view all members of condominiums they belong to
create policy "Members can view members of their condominium"
  on public.condominium_members for select
  using (
    exists (
      select 1 from public.condominium_members as cm
      where cm.condominium_id = condominium_members.condominium_id
        and cm.user_id = auth.uid()
    )
  );

-- Admins can manage members of their condominium
create policy "Admins can manage members"
  on public.condominium_members for all
  using (
    exists (
      select 1 from public.condominium_members as cm
      where cm.condominium_id = condominium_members.condominium_id
        and cm.user_id = auth.uid()
        and cm.system_role = 'admin'
    )
  );
