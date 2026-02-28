-- F17: Super Admin Panel
-- Adds condominium status field, creates audit_logs table, adds super-admin RLS policies

-- ─── condominiums.status ──────────────────────────────────────────────────────

alter table public.condominiums
  add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended'));

-- ─── audit_logs ───────────────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  condominium_id uuid references public.condominiums(id) on delete set null,
  actor_id       uuid references auth.users(id) on delete set null,
  action         text not null,
  entity_type    text not null,
  entity_id      uuid,
  metadata       jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists audit_logs_condominium_id_idx on public.audit_logs(condominium_id);
create index if not exists audit_logs_actor_id_idx       on public.audit_logs(actor_id);
create index if not exists audit_logs_created_at_idx     on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

-- Super-admins can read and write all audit logs
create policy "Super-admins have full access to audit_logs"
  on public.audit_logs for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Condominium admins can read their condominium's audit logs
create policy "Admins can view their condominium audit logs"
  on public.audit_logs for select
  using (
    condominium_id is not null
    and public.is_admin(condominium_id)
  );

-- ─── condominiums: super-admin bypass ─────────────────────────────────────────

drop policy if exists "Super-admins have full access to condominiums" on public.condominiums;

create policy "Super-admins have full access to condominiums"
  on public.condominiums for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ─── condominium_members: super-admin bypass ──────────────────────────────────

drop policy if exists "Super-admins have full access to condominium_members" on public.condominium_members;

create policy "Super-admins have full access to condominium_members"
  on public.condominium_members for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ─── profiles: super-admin bypass ─────────────────────────────────────────────
-- Drop first to avoid "already exists" error if applied more than once.

drop policy if exists "Super-admins have full access to profiles" on public.profiles;

create policy "Super-admins have full access to profiles"
  on public.profiles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
