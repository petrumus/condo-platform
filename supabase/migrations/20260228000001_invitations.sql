-- F02: Authentication — Invitations table
-- Stores invitation tokens for adding users to condominiums

create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),
  condominium_id  uuid not null references public.condominiums(id) on delete cascade,
  email           text not null,
  role            text not null check (role in ('admin', 'user')),
  token           text not null unique default encode(gen_random_bytes(32), 'hex'),
  accepted_at     timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Index for fast token lookups
create index on public.invitations (token);

-- Index for listing invitations per condominium
create index on public.invitations (condominium_id);

-- RLS
alter table public.invitations enable row level security;

-- Admins of the condominium can view invitations for their condominium
create policy "Condominium admins can view invitations"
  on public.invitations for select
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = invitations.condominium_id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- Admins of the condominium can create invitations
create policy "Condominium admins can create invitations"
  on public.invitations for insert
  with check (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = invitations.condominium_id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- Admins can delete (revoke) invitations for their condominium
create policy "Condominium admins can delete invitations"
  on public.invitations for delete
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = invitations.condominium_id
        and condominium_members.user_id = auth.uid()
        and condominium_members.system_role = 'admin'
    )
  );

-- Anyone can look up an invitation by token (needed for the accept flow)
-- The service role is used for this, so no RLS policy needed for anon reads.
-- Acceptance is handled via a server action using the service role client.
