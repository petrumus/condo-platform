-- F09: Initiatives tables

-- ─── initiatives ──────────────────────────────────────────────────────────────

create table if not exists public.initiatives (
  id              uuid primary key default gen_random_uuid(),
  condominium_id  uuid not null references public.condominiums(id) on delete cascade,
  title           text not null,
  description     text,
  category        text,
  status          text not null default 'pending_review'
                    check (status in ('draft', 'pending_review', 'approved', 'rejected', 'converted')),
  submitter_id    uuid not null references auth.users(id),
  admin_notes     text,
  created_at      timestamptz not null default now()
);

create index on public.initiatives (condominium_id);
create index on public.initiatives (status);
create index on public.initiatives (submitter_id);

alter table public.initiatives enable row level security;

-- Visibility rules:
-- - Submitter can see their own initiatives (any status)
-- - Admins can see all initiatives in their condominium
-- - Other members can only see 'approved' and 'converted' initiatives
create policy "Initiative visibility"
  on public.initiatives for select
  using (
    exists (
      select 1 from public.condominium_members cm
      where cm.condominium_id = initiatives.condominium_id
        and cm.user_id = auth.uid()
    )
    and (
      submitter_id = auth.uid()
      or status in ('approved', 'converted')
      or public.is_admin(condominium_id)
      or public.is_super_admin()
    )
  );

-- Any authenticated condominium member can submit
create policy "Members can submit initiatives"
  on public.initiatives for insert
  with check (
    exists (
      select 1 from public.condominium_members cm
      where cm.condominium_id = initiatives.condominium_id
        and cm.user_id = auth.uid()
    )
    and submitter_id = auth.uid()
  );

-- Admins update status and admin_notes; submitters can update their own draft
create policy "Admins can update initiatives"
  on public.initiatives for update
  using (public.is_admin(condominium_id) or public.is_super_admin())
  with check (public.is_admin(condominium_id) or public.is_super_admin());

create policy "Admins can delete initiatives"
  on public.initiatives for delete
  using (public.is_admin(condominium_id) or public.is_super_admin());

-- ─── initiative_attachments ────────────────────────────────────────────────────

create table if not exists public.initiative_attachments (
  id              uuid primary key default gen_random_uuid(),
  initiative_id   uuid not null references public.initiatives(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  uploaded_by     uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);

create index on public.initiative_attachments (initiative_id);

alter table public.initiative_attachments enable row level security;

-- Attachment visibility mirrors initiative visibility
create policy "Attachment visibility mirrors initiative"
  on public.initiative_attachments for select
  using (
    exists (
      select 1 from public.initiatives i
      where i.id = initiative_attachments.initiative_id
        and exists (
          select 1 from public.condominium_members cm
          where cm.condominium_id = i.condominium_id
            and cm.user_id = auth.uid()
        )
        and (
          i.submitter_id = auth.uid()
          or i.status in ('approved', 'converted')
          or public.is_admin(i.condominium_id)
          or public.is_super_admin()
        )
    )
  );

create policy "Members can insert attachments for their initiatives"
  on public.initiative_attachments for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.initiatives i
      where i.id = initiative_attachments.initiative_id
        and i.submitter_id = auth.uid()
    )
  );

create policy "Admins can delete attachments"
  on public.initiative_attachments for delete
  using (
    exists (
      select 1 from public.initiatives i
      where i.id = initiative_attachments.initiative_id
        and (public.is_admin(i.condominium_id) or public.is_super_admin())
    )
  );
