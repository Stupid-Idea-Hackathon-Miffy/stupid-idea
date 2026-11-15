-- Run once in a fresh Supabase project's SQL Editor.
begin;
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  age integer not null check (age between 18 and 99),
  bio text not null default '' check (char_length(bio) <= 300),
  interests text[] not null default '{}' check (cardinality(interests) <= 12),
  avatar text not null default '🫠' check (char_length(avatar) <= 16),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  check ((is_demo and auth_id is null) or (not is_demo and auth_id = id and auth_id is not null))
);

-- Reel IDs are stable identifiers owned by the frontend catalog (src/data/reels.js).
-- Text accommodates either numeric or string IDs, and avoids needing a second catalog.
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  reel_id text not null check (char_length(reel_id) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, reel_id)
);
create index likes_by_reel on public.likes(reel_id,user_id);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);
create unique index connections_one_pair on public.connections(least(sender_id,receiver_id), greatest(sender_id,receiver_id));

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.connections enable row level security;
revoke all on public.profiles, public.likes, public.connections from anon, authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,delete on public.likes to authenticated;

create policy own_profile_read on public.profiles for select to authenticated using (auth_id = (select auth.uid()));
create policy own_profile_create on public.profiles for insert to authenticated with check (id = (select auth.uid()) and auth_id = (select auth.uid()) and not is_demo);
create policy own_profile_edit on public.profiles for update to authenticated using (auth_id = (select auth.uid())) with check (id = (select auth.uid()) and auth_id = (select auth.uid()) and not is_demo);
create policy own_likes_read on public.likes for select to authenticated using (user_id = (select auth.uid()));
create policy own_likes_create on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy own_likes_remove on public.likes for delete to authenticated using (user_id = (select auth.uid()));

-- Match only authenticated caller; do not expose other people's full like history.
-- The rounded score is used for the 67% threshold: 2/3 displays 67%.
-- Require at least two shared likes because the current feed contains three reels.
create function public.get_matches()
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
  where auth.uid() is not null and s.shared_count >= 2 and s.compatibility >= 67
  order by s.compatibility desc,s.shared_count desc,p.id limit 50;
$$;

create function public.send_connection(target_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.get_matches() m where m.id=target_id) then
    raise exception 'This profile is not a current match';
  end if;
  insert into public.connections(sender_id,receiver_id) values(auth.uid(),target_id) on conflict do nothing;
end;
$$;

create function public.respond_connection(request_id uuid, accept_request boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  update public.connections c set status=case when accept_request then 'accepted' else 'declined' end
    where c.id=request_id and c.receiver_id=auth.uid() and c.status='pending';
  if not found then raise exception 'No pending incoming request found'; end if;
end;
$$;

create function public.get_connections()
returns table(id uuid, other_id uuid, name text, avatar text, is_demo boolean, status text, incoming boolean)
language sql stable security definer set search_path = '' as $$
  select c.id,p.id,p.name,p.avatar,p.is_demo,c.status,c.receiver_id=auth.uid()
  from public.connections c join public.profiles p on p.id=case when c.sender_id=auth.uid() then c.receiver_id else c.sender_id end
  where auth.uid() is not null and (c.sender_id=auth.uid() or c.receiver_id=auth.uid())
  order by c.created_at desc;
$$;

revoke all on function public.get_matches(), public.send_connection(uuid), public.respond_connection(uuid,boolean), public.get_connections() from public, anon;
grant execute on function public.get_matches(), public.send_connection(uuid), public.respond_connection(uuid,boolean), public.get_connections() to authenticated;

-- Clearly fictional profiles with overlapping histories on Felicia's current reel IDs 1,2,3.
insert into public.profiles(id,name,age,bio,interests,avatar,is_demo) values
('00000000-0000-4000-8000-000000000001','Alex',22,'My screen time report is between me and God.',array['Cats','Memes','Animals'],'🦝',true),
('00000000-0000-4000-8000-000000000002','Jamie',21,'Looking for someone to send 47 reels to before breakfast.',array['Dogs','Brain rot'],'🐸',true),
('00000000-0000-4000-8000-000000000003','Sam',24,'Chronically online, occasionally outside.',array['Birds','Cats'],'🦜',true),
('00000000-0000-4000-8000-000000000004','Taylor',23,'My love language is sending you a reel you already saw.',array['Animals','Comedy'],'🐱',true),
('00000000-0000-4000-8000-000000000005','Morgan',22,'The algorithm knows me better than I do.',array['Dogs','Birds'],'🐶',true);
insert into public.likes(user_id,reel_id)
select p.id::uuid,v.reel_id from (values
('00000000-0000-4000-8000-000000000001',array['1','2','3']),
('00000000-0000-4000-8000-000000000002',array['1','2']),
('00000000-0000-4000-8000-000000000003',array['2','3']),
('00000000-0000-4000-8000-000000000004',array['1','2','3']),
('00000000-0000-4000-8000-000000000005',array['1','3'])) p(id,reels)
cross join lateral unnest(p.reels) v(reel_id);
commit;
