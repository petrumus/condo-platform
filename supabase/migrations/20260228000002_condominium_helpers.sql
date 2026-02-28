-- F03: Postgres helper functions and seed trigger for condominiums

-- ─── is_super_admin() ─────────────────────────────────────────────────────────
-- Returns true if the current user has the super-admin role in app_metadata.

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super-admin'
    or (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean,
    false
  )
$$;

-- ─── is_admin(condominium_id) ─────────────────────────────────────────────────
-- Returns true if the current user has system_role = 'admin' for the given condo.

create or replace function public.is_admin(p_condominium_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.condominium_members
    where condominium_id = p_condominium_id
      and user_id = auth.uid()
      and system_role = 'admin'
  )
$$;

-- ─── get_my_condominium_id(slug) ──────────────────────────────────────────────
-- Returns the UUID of the condominium with the given slug if the current user
-- is a member, or NULL otherwise. Useful as an RLS helper.

create or replace function public.get_my_condominium_id(p_slug text)
returns uuid
language sql
security definer
stable
as $$
  select c.id
  from public.condominiums c
  join public.condominium_members cm on cm.condominium_id = c.id
  where c.slug = p_slug
    and cm.user_id = auth.uid()
  limit 1
$$;

-- ─── Seed built-in functional titles ─────────────────────────────────────────
-- Automatically insert the four built-in titles when a condominium is created.

create or replace function public.seed_functional_titles()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.functional_titles (condominium_id, name, sort_order)
  values
    (new.id, 'Administrator', 1),
    (new.id, 'Councilor',     2),
    (new.id, 'Auditor',       3),
    (new.id, 'Accountant',    4);
  return new;
end;
$$;

drop trigger if exists on_condominium_created on public.condominiums;

create trigger on_condominium_created
  after insert on public.condominiums
  for each row execute function public.seed_functional_titles();

-- ─── Super-admin bypass policies ─────────────────────────────────────────────
-- Allow super-admins full access to all condominiums and members.

create policy "Super-admins have full access to condominiums"
  on public.condominiums for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super-admins have full access to condominium_members"
  on public.condominium_members for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super-admins have full access to functional_titles"
  on public.functional_titles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
