-- F12: Announcements tables

-- ─── announcements ──────────────────────────────────────────────────────────────

create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  condominium_id  uuid not null references public.condominiums(id) on delete cascade,
  title           text not null,
  body            text not null default '',
  pinned          boolean not null default false,
  published_at    timestamptz,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);

create index on public.announcements (condominium_id);
create index on public.announcements (pinned);
create index on public.announcements (published_at);

alter table public.announcements enable row level security;

-- All condominium members can read published announcements
-- Admins can also see unpublished (draft) announcements
create policy "Members can read published announcements"
  on public.announcements for select
  using (
    exists (
      select 1 from public.condominium_members cm
      where cm.condominium_id = announcements.condominium_id
        and cm.user_id = auth.uid()
    )
    and (
      published_at is not null
      or public.is_admin(condominium_id)
      or public.is_super_admin()
    )
  );

create policy "Admins can create announcements"
  on public.announcements for insert
  with check (
    public.is_admin(condominium_id) or public.is_super_admin()
  );

create policy "Admins can update announcements"
  on public.announcements for update
  using (public.is_admin(condominium_id) or public.is_super_admin())
  with check (public.is_admin(condominium_id) or public.is_super_admin());

create policy "Admins can delete announcements"
  on public.announcements for delete
  using (public.is_admin(condominium_id) or public.is_super_admin());

-- ─── announcement_attachments ────────────────────────────────────────────────────

create table if not exists public.announcement_attachments (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  file_size_bytes bigint,
  uploaded_by     uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);

create index on public.announcement_attachments (announcement_id);

alter table public.announcement_attachments enable row level security;

-- Members can read attachments for published announcements; admins see all
create policy "Members can read announcement attachments"
  on public.announcement_attachments for select
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_attachments.announcement_id
        and exists (
          select 1 from public.condominium_members cm
          where cm.condominium_id = a.condominium_id
            and cm.user_id = auth.uid()
        )
        and (
          a.published_at is not null
          or public.is_admin(a.condominium_id)
          or public.is_super_admin()
        )
    )
  );

create policy "Admins can insert announcement attachments"
  on public.announcement_attachments for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_attachments.announcement_id
        and (public.is_admin(a.condominium_id) or public.is_super_admin())
    )
  );

create policy "Admins can delete announcement attachments"
  on public.announcement_attachments for delete
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_attachments.announcement_id
        and (public.is_admin(a.condominium_id) or public.is_super_admin())
    )
  );
