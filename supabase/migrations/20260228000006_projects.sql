-- F07: Projects tables

-- ─── projects ─────────────────────────────────────────────────────────────────

create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  condominium_id    uuid not null references public.condominiums(id) on delete cascade,
  title             text not null,
  description       text,
  category          text,
  status            text not null default 'proposed'
                      check (status in ('proposed', 'approved', 'in_progress', 'completed', 'archived')),
  estimated_cost    numeric(12, 2),
  actual_cost       numeric(12, 2),
  start_date        date,
  end_date          date,
  responsible_person text,
  created_by        uuid not null references auth.users(id),
  created_at        timestamptz not null default now()
);

create index on public.projects (condominium_id);
create index on public.projects (status);

alter table public.projects enable row level security;

-- Members see approved/in_progress/completed/archived projects; admins see all
create policy "Members can view visible projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = projects.condominium_id
        and condominium_members.user_id = auth.uid()
    )
    and (
      status in ('approved', 'in_progress', 'completed', 'archived')
      or public.is_admin(condominium_id)
      or public.is_super_admin()
    )
  );

create policy "Admins can insert projects"
  on public.projects for insert
  with check (public.is_admin(condominium_id) or public.is_super_admin());

create policy "Admins can update projects"
  on public.projects for update
  using (public.is_admin(condominium_id) or public.is_super_admin())
  with check (public.is_admin(condominium_id) or public.is_super_admin());

create policy "Admins can delete projects"
  on public.projects for delete
  using (public.is_admin(condominium_id) or public.is_super_admin());

-- ─── project_updates ──────────────────────────────────────────────────────────

create table if not exists public.project_updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  body        text not null,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create index on public.project_updates (project_id);

alter table public.project_updates enable row level security;

-- Members can view updates for projects they can see
create policy "Members can view project updates"
  on public.project_updates for select
  using (
    exists (
      select 1
      from public.projects p
      join public.condominium_members cm on cm.condominium_id = p.condominium_id
      where p.id = project_updates.project_id
        and cm.user_id = auth.uid()
        and (
          p.status in ('approved', 'in_progress', 'completed', 'archived')
          or public.is_admin(p.condominium_id)
          or public.is_super_admin()
        )
    )
  );

create policy "Admins can insert project updates"
  on public.project_updates for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_updates.project_id
        and (public.is_admin(p.condominium_id) or public.is_super_admin())
    )
  );

create policy "Admins can delete project updates"
  on public.project_updates for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_updates.project_id
        and (public.is_admin(p.condominium_id) or public.is_super_admin())
    )
  );
