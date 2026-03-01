-- Fix: add direct FK from condominium_members.user_id → profiles.id
-- so PostgREST can resolve the profiles() embed in queries like:
--   .from("condominium_members").select("..., profiles(id, email, full_name)")
--
-- Without this FK, PostgREST cannot detect the relationship because
-- user_id only references auth.users(id), not public.profiles(id).

alter table public.condominium_members
  add constraint condominium_members_user_id_profiles_fk
  foreign key (user_id) references public.profiles(id)
  on delete cascade;
