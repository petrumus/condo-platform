-- F10: Ballots & Voting tables

-- ─── ballots ───────────────────────────────────────────────────────────────────

create table if not exists public.ballots (
  id                    uuid primary key default gen_random_uuid(),
  condominium_id        uuid not null references public.condominiums(id) on delete cascade,
  title                 text not null,
  description           text,
  question_type         text not null default 'yes_no'
                          check (question_type in ('yes_no', 'single_choice', 'multi_choice')),
  options               jsonb not null default '[]'::jsonb,
  open_at               timestamptz not null,
  close_at              timestamptz not null,
  quorum_pct            numeric check (quorum_pct > 0 and quorum_pct <= 100),
  linked_initiative_id  uuid references public.initiatives(id) on delete set null,
  status                text not null default 'draft'
                          check (status in ('draft', 'open', 'closed', 'results_published')),
  created_by            uuid not null references auth.users(id),
  created_at            timestamptz not null default now()
);

create index on public.ballots (condominium_id);
create index on public.ballots (status);
create index on public.ballots (open_at);
create index on public.ballots (close_at);

alter table public.ballots enable row level security;

-- Members can see all non-draft ballots in their condominium
-- Admins can also see drafts
create policy "Ballot visibility for members"
  on public.ballots for select
  using (
    exists (
      select 1 from public.condominium_members cm
      where cm.condominium_id = ballots.condominium_id
        and cm.user_id = auth.uid()
    )
    and (
      status != 'draft'
      or public.is_admin(condominium_id)
      or public.is_super_admin()
    )
  );

-- Only admins can create ballots
create policy "Admins can create ballots"
  on public.ballots for insert
  with check (
    public.is_admin(condominium_id) or public.is_super_admin()
  );

-- Only admins can update ballots
create policy "Admins can update ballots"
  on public.ballots for update
  using (public.is_admin(condominium_id) or public.is_super_admin())
  with check (public.is_admin(condominium_id) or public.is_super_admin());

-- Only admins can delete ballots
create policy "Admins can delete ballots"
  on public.ballots for delete
  using (public.is_admin(condominium_id) or public.is_super_admin());

-- ─── votes ─────────────────────────────────────────────────────────────────────

create table if not exists public.votes (
  id               uuid primary key default gen_random_uuid(),
  ballot_id        uuid not null references public.ballots(id) on delete cascade,
  voter_id         uuid not null references auth.users(id),
  selected_options jsonb not null default '[]'::jsonb,
  voted_at         timestamptz not null default now(),
  unique (ballot_id, voter_id)
);

create index on public.votes (ballot_id);
create index on public.votes (voter_id);

alter table public.votes enable row level security;

-- Admins can see all votes for ballots in their condominium
create policy "Admins can view votes"
  on public.votes for select
  using (
    exists (
      select 1 from public.ballots b
      where b.id = votes.ballot_id
        and (public.is_admin(b.condominium_id) or public.is_super_admin())
    )
  );

-- Members can see their own vote
create policy "Members can view own vote"
  on public.votes for select
  using (voter_id = auth.uid());

-- Any member can cast a vote (unique constraint prevents duplicates)
create policy "Members can cast votes"
  on public.votes for insert
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.ballots b
      join public.condominium_members cm on cm.condominium_id = b.condominium_id
      where b.id = votes.ballot_id
        and b.status = 'open'
        and cm.user_id = auth.uid()
    )
  );

-- ─── has_voted helper function ─────────────────────────────────────────────────

create or replace function public.has_voted(p_ballot_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.votes
    where ballot_id = p_ballot_id
      and voter_id = p_user_id
  );
$$;
