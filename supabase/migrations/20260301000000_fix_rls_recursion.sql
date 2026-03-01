-- Fix: infinite recursion in RLS policies on condominium_members
--
-- Root cause: policies on condominium_members used inline
--   EXISTS(SELECT 1 FROM condominium_members ...) subqueries.
--   PostgreSQL applies RLS to those inner queries, triggering the same
--   policies again → error 42P17 "infinite recursion detected in policy".
--
-- Solution: replace inline subqueries with SECURITY DEFINER helper
--   functions that bypass RLS when checking membership.

-- ─── 1. Create is_member() helper ────────────────────────────────────────────
-- Returns true if the current user belongs to the given condominium.

create or replace function public.is_member(p_condominium_id uuid)
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
  )
$$;

-- ─── 2. Fix condominium_members policies (critical — self-referencing) ───────

drop policy if exists "Members can view members of their condominium"
  on public.condominium_members;

create policy "Members can view members of their condominium"
  on public.condominium_members for select
  using (public.is_member(condominium_id));

drop policy if exists "Admins can manage members"
  on public.condominium_members;

create policy "Admins can manage members"
  on public.condominium_members for all
  using (public.is_admin(condominium_id));

-- ─── 3. Fix condominiums policies ────────────────────────────────────────────

drop policy if exists "Members can view their condominium"
  on public.condominiums;

create policy "Members can view their condominium"
  on public.condominiums for select
  using (public.is_member(id));

drop policy if exists "Admins can update their condominium"
  on public.condominiums;

create policy "Admins can update their condominium"
  on public.condominiums for update
  using (public.is_admin(id));

-- ─── 4. Fix functional_titles policies ───────────────────────────────────────

drop policy if exists "Members can view functional titles"
  on public.functional_titles;

create policy "Members can view functional titles"
  on public.functional_titles for select
  using (public.is_member(condominium_id));

drop policy if exists "Admins can manage functional titles"
  on public.functional_titles;

create policy "Admins can manage functional titles"
  on public.functional_titles for all
  using (public.is_admin(condominium_id));
