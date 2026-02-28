-- F13: Maintenance Requests tables

-- ─── maintenance_requests ──────────────────────────────────────────────────────

create table if not exists public.maintenance_requests (
  id              uuid primary key default gen_random_uuid(),
  condominium_id  uuid not null references public.condominiums(id) on delete cascade,
  submitter_id    uuid not null references auth.users(id),
  title           text not null,
  description     text,
  category        text,
  location        text,
  priority        text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status          text not null default 'open' check (status in ('open', 'in_review', 'in_progress', 'resolved', 'closed')),
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.maintenance_requests (condominium_id);
create index on public.maintenance_requests (submitter_id);
create index on public.maintenance_requests (status);
create index on public.maintenance_requests (created_at);

alter table public.maintenance_requests enable row level security;

-- Submitters can see their own requests; admins can see all
create policy "Members can read their own maintenance requests"
  on public.maintenance_requests for select
  using (
    exists (
      select 1 from public.condominium_members cm
      where cm.condominium_id = maintenance_requests.condominium_id
        and cm.user_id = auth.uid()
    )
    and (
      submitter_id = auth.uid()
      or public.is_admin(condominium_id)
      or public.is_super_admin()
    )
  );

-- All authenticated members can submit requests
create policy "Members can submit maintenance requests"
  on public.maintenance_requests for insert
  with check (
    submitter_id = auth.uid()
    and exists (
      select 1 from public.condominium_members cm
      where cm.condominium_id = maintenance_requests.condominium_id
        and cm.user_id = auth.uid()
    )
  );

-- Admins can update status, priority, admin_notes
create policy "Admins can update maintenance requests"
  on public.maintenance_requests for update
  using (public.is_admin(condominium_id) or public.is_super_admin())
  with check (public.is_admin(condominium_id) or public.is_super_admin());

-- Admins can delete requests
create policy "Admins can delete maintenance requests"
  on public.maintenance_requests for delete
  using (public.is_admin(condominium_id) or public.is_super_admin());

-- Auto-update updated_at on row change
create or replace function public.set_maintenance_request_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger maintenance_requests_updated_at
  before update on public.maintenance_requests
  for each row execute function public.set_maintenance_request_updated_at();

-- ─── maintenance_attachments ────────────────────────────────────────────────────

create table if not exists public.maintenance_attachments (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references public.maintenance_requests(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  file_size_bytes bigint,
  uploaded_by     uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);

create index on public.maintenance_attachments (request_id);

alter table public.maintenance_attachments enable row level security;

-- Members can read attachments for requests they can see
create policy "Members can read maintenance attachments"
  on public.maintenance_attachments for select
  using (
    exists (
      select 1 from public.maintenance_requests mr
      where mr.id = maintenance_attachments.request_id
        and (
          mr.submitter_id = auth.uid()
          or public.is_admin(mr.condominium_id)
          or public.is_super_admin()
        )
    )
  );

-- Submitter can upload attachments when creating a request
create policy "Members can insert maintenance attachments"
  on public.maintenance_attachments for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.maintenance_requests mr
      where mr.id = maintenance_attachments.request_id
        and mr.submitter_id = auth.uid()
    )
  );

-- Admins can delete attachments
create policy "Admins can delete maintenance attachments"
  on public.maintenance_attachments for delete
  using (
    exists (
      select 1 from public.maintenance_requests mr
      where mr.id = maintenance_attachments.request_id
        and (public.is_admin(mr.condominium_id) or public.is_super_admin())
    )
  );
