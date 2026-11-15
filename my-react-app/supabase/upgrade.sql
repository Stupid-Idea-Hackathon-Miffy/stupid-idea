-- Run AFTER the original setup.sql. Safe to rerun.
begin;
-- The current frontend feed (src/data/reels.js) uses IDs 1, 2, 3.
-- Insert any future reel IDs here before letting users send them.
create table if not exists public.reel_catalog (
 reel_id text primary key check (char_length(reel_id) between 1 and 100)
);
insert into public.reel_catalog(reel_id) values ('1'),('2'),('3') on conflict do nothing;
alter table public.reel_catalog enable row level security;
revoke all on public.reel_catalog from public,anon,authenticated;
create table if not exists public.reel_messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade,
 reel_id text not null check (char_length(reel_id) between 1 and 100),
 created_at timestamptz not null default now(), check(sender_id <> receiver_id)
);
create index if not exists reel_messages_pair on public.reel_messages(sender_id,receiver_id,created_at);
create table if not exists public.reject_roulette (
 user_id uuid not null references public.profiles(id) on delete cascade,
 target_id uuid not null references public.profiles(id) on delete cascade,
 locked_until timestamptz,
 hidden boolean not null default false,
 primary key(user_id,target_id), check(user_id <> target_id)
);
alter table public.reject_roulette add column if not exists add_locked_until timestamptz;
alter table public.reel_messages enable row level security;
alter table public.reject_roulette enable row level security;
revoke all on public.reel_messages,public.reject_roulette from anon,authenticated;

create or replace function public.pair_hidden(a uuid,b uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.reject_roulette r where r.hidden and ((r.user_id=a and r.target_id=b) or (r.user_id=b and r.target_id=a)));
$$;
revoke all on function public.pair_hidden(uuid,uuid) from public,anon,authenticated;

create or replace function public.get_matches()
returns table(id uuid, name text, age integer, bio text, interests text[], avatar text,
  is_demo boolean, score integer, shared_reels text[], connection_status text)
language sql stable security definer set search_path = '' as $$
  with mine as (select l.reel_id from public.likes l where l.user_id = auth.uid()),
  my_count as (select count(*) as n from mine),
  scores as (
    select l.user_id,
      round(100.0 * count(*) filter (where m.reel_id is not null) /
        nullif((select n from my_count) + count(*) - count(*) filter (where m.reel_id is not null),0))::integer as compatibility,
      count(*) filter (where m.reel_id is not null) as shared_count,
      array_agg(l.reel_id order by l.reel_id) filter (where m.reel_id is not null) as shared
    from public.likes l left join mine m on m.reel_id = l.reel_id
    where l.user_id <> auth.uid() group by l.user_id
  )
  select p.id,p.name,p.age,p.bio,p.interests,p.avatar,p.is_demo,s.compatibility,s.shared,c.status
  from scores s join public.profiles p on p.id=s.user_id
  left join public.connections c on (c.sender_id=auth.uid() and c.receiver_id=p.id) or (c.receiver_id=auth.uid() and c.sender_id=p.id)
  where auth.uid() is not null and not public.pair_hidden(auth.uid(),p.id) and s.shared_count >= 2 and s.compatibility >= 67
  order by s.compatibility desc,s.shared_count desc,p.id limit 50;
$$;

create or replace function public.get_connections()
returns table(id uuid, other_id uuid, name text, avatar text, is_demo boolean, status text, incoming boolean)
language sql stable security definer set search_path = '' as $$
  select c.id,p.id,p.name,p.avatar,p.is_demo,c.status,c.receiver_id=auth.uid()
  from public.connections c join public.profiles p on p.id=case when c.sender_id=auth.uid() then c.receiver_id else c.sender_id end
  where auth.uid() is not null and (c.sender_id=auth.uid() or c.receiver_id=auth.uid())
  and not public.pair_hidden(auth.uid(),p.id)
  order by c.created_at desc;
$$;

-- Fictional demo profiles instantly accept; real people must explicitly accept.
create or replace function public.send_connection(target_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if not exists(select 1 from public.get_matches() m where m.id=target_id) then raise exception 'Not a current match'; end if;
 insert into public.connections(sender_id,receiver_id,status) values(auth.uid(),target_id,
  case when exists(select 1 from public.profiles p where p.id=target_id and p.is_demo) then 'accepted' else 'pending' end) on conflict do nothing;
end; $$;
update public.connections c set status='accepted' where c.status='pending' and exists(select 1 from public.profiles p where p.id=c.receiver_id and p.is_demo);

drop function if exists public.get_roulette_state();
create function public.get_roulette_state()
returns table(target_id uuid,locked_until timestamptz,add_locked_until timestamptz)
language sql stable security definer set search_path='' as $$
 select r.target_id,r.locked_until,r.add_locked_until from public.reject_roulette r where r.user_id=auth.uid() and not r.hidden;
$$;

create or replace function public.spin_rejection(p_target uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); r public.reject_roulette%rowtype; won boolean; until_time timestamptz;
begin
 if me is null or p_target is null or p_target=me then raise exception 'Invalid match'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(me,p_target)::text || ':' || greatest(me,p_target)::text,0));
 if public.pair_hidden(me,p_target) or (not exists(select 1 from public.get_matches() m where m.id=p_target) and not exists(select 1 from public.connections c where c.status in ('accepted','pending') and ((c.sender_id=me and c.receiver_id=p_target) or (c.receiver_id=me and c.sender_id=p_target)))) then raise exception 'Not a current match or connection'; end if;
 insert into public.reject_roulette(user_id,target_id) values(me,p_target) on conflict do nothing;
 select * into r from public.reject_roulette where user_id=me and target_id=p_target for update;
 if r.hidden then raise exception 'Already dismissed'; end if;
 if r.locked_until > now() then return jsonb_build_object('outcome','locked','locked_until',r.locked_until); end if;
 won := random() < 0.10;
 until_time := case when won then null else now() + interval '7 days' end;
 update public.reject_roulette set hidden=won,locked_until=until_time where user_id=me and target_id=p_target;
 return jsonb_build_object('outcome',case when won then 'won' else 'lost' end,'locked_until',until_time);
end; $$;

-- Always available, even after losing roulette. Prevents contact in both directions.
create or replace function public.dismiss_match(p_target uuid)
returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();
begin
 if me is null or p_target is null or p_target=me then raise exception 'Invalid profile'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(me,p_target)::text || ':' || greatest(me,p_target)::text,0));
 if not exists(select 1 from public.get_matches() m where m.id=p_target) and not exists(select 1 from public.connections c where (c.sender_id=me and c.receiver_id=p_target) or (c.receiver_id=me and c.sender_id=p_target)) then raise exception 'No such match or connection'; end if;
 insert into public.reject_roulette(user_id,target_id,hidden) values(me,p_target,true)
 on conflict(user_id,target_id) do update set hidden=true;
end; $$;

create or replace function public.send_reel(p_target uuid,p_reel text)
returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();
begin
 if me is null or p_target is null or p_target=me or p_reel is null or char_length(p_reel) not between 1 and 100 or p_reel !~ '^[A-Za-z0-9_-]+$' then raise exception 'Invalid reel or recipient'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(me,p_target)::text || ':' || greatest(me,p_target)::text,0));
 if not exists(select 1 from public.reel_catalog r where r.reel_id=p_reel) then raise exception 'Unknown reel ID. Register it in reel_catalog first'; end if;
 if public.pair_hidden(me,p_target) or not exists(select 1 from public.connections c where c.status='accepted' and ((c.sender_id=me and c.receiver_id=p_target) or (c.receiver_id=me and c.sender_id=p_target))) then raise exception 'You need an accepted connection'; end if;
 insert into public.reel_messages(sender_id,receiver_id,reel_id) values(me,p_target,p_reel);
 -- Explicitly labeled fictional accounts send an automated reel response.
 if exists(select 1 from public.profiles p where p.id=p_target and p.is_demo) then
 insert into public.reel_messages(sender_id,receiver_id,reel_id,created_at) values(p_target,me,case when p_reel='1' then '2' else '1' end,clock_timestamp() + interval '1 millisecond');
 end if;
end; $$;

create or replace function public.get_reel_messages(p_target uuid)
returns table(id uuid,sender_id uuid,receiver_id uuid,reel_id text,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select m.id,m.sender_id,m.receiver_id,m.reel_id,m.created_at from public.reel_messages m
 where auth.uid() is not null and not public.pair_hidden(auth.uid(),p_target)
 and exists(select 1 from public.connections c where c.status='accepted' and ((c.sender_id=auth.uid() and c.receiver_id=p_target) or (c.receiver_id=auth.uid() and c.sender_id=p_target)))
 and ((m.sender_id=auth.uid() and m.receiver_id=p_target) or (m.sender_id=p_target and m.receiver_id=auth.uid()))
 order by m.created_at,m.id;
$$;
revoke all on function public.get_roulette_state(),public.spin_rejection(uuid),public.dismiss_match(uuid),public.send_reel(uuid,text),public.get_reel_messages(uuid) from public,anon;
grant execute on function public.get_roulette_state(),public.spin_rejection(uuid),public.dismiss_match(uuid),public.send_reel(uuid,text),public.get_reel_messages(uuid) to authenticated;
-- Adding is a 50/50 coin toss, with a short retry cooldown for the demo.
-- Incoming real requests also require an explicit spin to accept; failure leaves them pending.
create or replace function public.spin_add(p_target uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); r public.reject_roulette%rowtype; existing public.connections%rowtype; won boolean; until_time timestamptz;
begin
 if me is null or p_target is null or p_target=me then raise exception 'Invalid match'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(me,p_target)::text || ':' || greatest(me,p_target)::text,0));
 if public.pair_hidden(me,p_target) then raise exception 'Match unavailable'; end if;
 select * into existing from public.connections c where (c.sender_id=me and c.receiver_id=p_target) or (c.receiver_id=me and c.sender_id=p_target);
 if existing.id is not null then
   if existing.status <> 'pending' or existing.receiver_id <> me then raise exception 'Already requested or connected'; end if;
 elsif not exists(select 1 from public.get_matches() m where m.id=p_target) then raise exception 'Not a current match'; end if;
 insert into public.reject_roulette(user_id,target_id) values(me,p_target) on conflict do nothing;
 select * into r from public.reject_roulette where user_id=me and target_id=p_target for update;
 if r.add_locked_until > now() then return jsonb_build_object('outcome','locked','locked_until',r.add_locked_until); end if;
 won := random() < 0.50;
 until_time := case when won then null else now() + interval '30 seconds' end;
 update public.reject_roulette set add_locked_until=until_time where user_id=me and target_id=p_target;
 if won then
   if existing.id is not null then
      update public.connections set status='accepted' where id=existing.id;
   else
      perform public.send_connection(p_target);
   end if;
 end if;
 return jsonb_build_object('outcome',case when won then 'won' else 'lost' end,'locked_until',until_time);
end; $$;
-- Remove legacy direct add/accept RPC permissions so roulette cannot be bypassed.
revoke all on function public.send_connection(uuid),public.respond_connection(uuid,boolean) from public,anon,authenticated;
revoke all on function public.spin_add(uuid) from public,anon;
grant execute on function public.spin_add(uuid) to authenticated;
commit;
