-- F06: Yearly Budget Plan tables

-- ─── budget_plans ─────────────────────────────────────────────────────────────

create table if not exists public.budget_plans (
  id              uuid primary key default gen_random_uuid(),
  condominium_id  uuid not null references public.condominiums(id) on delete cascade,
  year            integer not null,
  status          text not null default 'draft' check (status in ('draft', 'published')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  unique (condominium_id, year)
);

create index on public.budget_plans (condominium_id);

alter table public.budget_plans enable row level security;

-- Members see published budgets; admins also see drafts
create policy "Members can view budget plans"
  on public.budget_plans for select
  using (
    exists (
      select 1 from public.condominium_members
      where condominium_members.condominium_id = budget_plans.condominium_id
        and condominium_members.user_id = auth.uid()
    )
    and (
      status = 'published'
      or public.is_admin(condominium_id)
      or public.is_super_admin()
    )
  );

create policy "Admins can insert budget plans"
  on public.budget_plans for insert
  with check (public.is_admin(condominium_id) or public.is_super_admin());

create policy "Admins can update budget plans"
  on public.budget_plans for update
  using (public.is_admin(condominium_id) or public.is_super_admin())
  with check (public.is_admin(condominium_id) or public.is_super_admin());

create policy "Admins can delete budget plans"
  on public.budget_plans for delete
  using (public.is_admin(condominium_id) or public.is_super_admin());

-- ─── budget_line_items ────────────────────────────────────────────────────────

create table if not exists public.budget_line_items (
  id              uuid primary key default gen_random_uuid(),
  budget_plan_id  uuid not null references public.budget_plans(id) on delete cascade,
  category        text not null,
  amount          numeric(12, 2) not null default 0,
  notes           text,
  sort_order      integer not null default 0
);

create index on public.budget_line_items (budget_plan_id);

alter table public.budget_line_items enable row level security;

-- Members can view line items for plans they can see
create policy "Members can view budget line items"
  on public.budget_line_items for select
  using (
    exists (
      select 1
      from public.budget_plans bp
      join public.condominium_members cm on cm.condominium_id = bp.condominium_id
      where bp.id = budget_line_items.budget_plan_id
        and cm.user_id = auth.uid()
        and (
          bp.status = 'published'
          or public.is_admin(bp.condominium_id)
          or public.is_super_admin()
        )
    )
  );

create policy "Admins can insert budget line items"
  on public.budget_line_items for insert
  with check (
    exists (
      select 1 from public.budget_plans bp
      where bp.id = budget_line_items.budget_plan_id
        and (public.is_admin(bp.condominium_id) or public.is_super_admin())
    )
  );

create policy "Admins can update budget line items"
  on public.budget_line_items for update
  using (
    exists (
      select 1 from public.budget_plans bp
      where bp.id = budget_line_items.budget_plan_id
        and (public.is_admin(bp.condominium_id) or public.is_super_admin())
    )
  )
  with check (
    exists (
      select 1 from public.budget_plans bp
      where bp.id = budget_line_items.budget_plan_id
        and (public.is_admin(bp.condominium_id) or public.is_super_admin())
    )
  );

create policy "Admins can delete budget line items"
  on public.budget_line_items for delete
  using (
    exists (
      select 1 from public.budget_plans bp
      where bp.id = budget_line_items.budget_plan_id
        and (public.is_admin(bp.condominium_id) or public.is_super_admin())
    )
  );
