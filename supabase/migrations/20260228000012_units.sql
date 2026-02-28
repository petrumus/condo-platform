-- F14: Units & Ownership
-- Adds units and unit_owners tables with RLS policies.

-- ─── units ────────────────────────────────────────────────────────────────────

create table if not exists public.units (
  id                    uuid primary key default gen_random_uuid(),
  condominium_id        uuid not null references public.condominiums(id) on delete cascade,
  unit_number           text not null,
  floor                 text,
  building_section      text,
  area_m2               numeric not null check (area_m2 > 0),
  ownership_share_pct   numeric check (ownership_share_pct >= 0 and ownership_share_pct <= 100),
  created_at            timestamptz not null default now()
);

create index on public.units (condominium_id);

alter table public.units enable row level security;

-- All members of the condominium can view units
create policy "Members can view units"
  on public.units for select
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = units.condominium_id
        and condominium_members.user_id = auth.uid()
    )
  );

-- Only admins can create units
create policy "Admins can create units"
  on public.units for insert
  with check (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = units.condominium_id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- Only admins can update units
create policy "Admins can update units"
  on public.units for update
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = units.condominium_id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- Only admins can delete units
create policy "Admins can delete units"
  on public.units for delete
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = units.condominium_id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- ─── unit_owners ──────────────────────────────────────────────────────────────

create table if not exists public.unit_owners (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references public.units(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  owner_name   text not null,
  owner_email  text,
  created_at   timestamptz not null default now()
);

create index on public.unit_owners (unit_id);
create index on public.unit_owners (user_id);

alter table public.unit_owners enable row level security;

-- All members can view unit_owners (needed to see who owns which unit)
create policy "Members can view unit owners"
  on public.unit_owners for select
  using (
    exists (
      select 1
      from public.units u
      join public.condominium_members cm on cm.condominium_id = u.condominium_id
      where u.id = unit_owners.unit_id
        and cm.user_id = auth.uid()
    )
  );

-- Only admins can manage unit_owners
create policy "Admins can manage unit owners"
  on public.unit_owners for all
  using (
    exists (
      select 1
      from public.units u
      join public.condominium_members cm on cm.condominium_id = u.condominium_id
      where u.id = unit_owners.unit_id
        and cm.user_id = auth.uid()
        and cm.system_role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.units u
      join public.condominium_members cm on cm.condominium_id = u.condominium_id
      where u.id = unit_owners.unit_id
        and cm.user_id = auth.uid()
        and cm.system_role = 'admin'
    )
  );
