-- Run after setup.sql and upgrade.sql. No existing data is modified.
begin;
create table if not exists public.profile_reels (
  user_id uuid not null references public.profiles(id) on delete cascade,
  reel_id text not null check (char_length(reel_id) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, reel_id)
);
alter table public.profile_reels enable row level security;
revoke all on table public.profile_reels from public, anon, authenticated;
grant select, insert, delete on table public.profile_reels to authenticated;
drop policy if exists own_profile_reels_read on public.profile_reels;
drop policy if exists own_profile_reels_insert on public.profile_reels;
drop policy if exists own_profile_reels_delete on public.profile_reels;
create policy own_profile_reels_read on public.profile_reels for select to authenticated using (user_id = (select auth.uid()));
create policy own_profile_reels_insert on public.profile_reels for insert to authenticated with check (user_id = (select auth.uid()));
create policy own_profile_reels_delete on public.profile_reels for delete to authenticated using (user_id = (select auth.uid()));

-- Other profiles are visible only if they are a current match or accepted connection.
-- Existing pair_hidden checks inside get_matches/get_connections remain in effect.
create or replace function public.get_visible_profile_reels()
returns table(user_id uuid, reel_id text)
language sql stable security definer set search_path = '' as $$
  with visible as (
    select auth.uid() as id
    union select m.id from public.get_matches() m
    union select c.other_id from public.get_connections() c where c.status = 'accepted'
  )
  select r.user_id, r.reel_id
  from public.profile_reels r join visible v on v.id = r.user_id
  where auth.uid() is not null
  order by r.created_at desc, r.reel_id;
$$;
revoke all on function public.get_visible_profile_reels() from public, anon, authenticated;
grant execute on function public.get_visible_profile_reels() to authenticated;
commit;
