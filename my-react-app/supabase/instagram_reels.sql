-- ReelMate: switch the feed from the 3 emoji placeholder reels (IDs 1, 2, 3)
-- to the Instagram reels in src/data/reels.js (IDs 4–10).
-- Run in the Supabase SQL Editor AFTER upgrade.sql (and profile_reels.sql).
-- Then run refresh_demo_users.sql so the demo profiles like the new reels.
-- Safe to rerun.
begin;

-- 1. Register the new reels so they can be sent in messages.
insert into public.reel_catalog(reel_id)
values ('4'),('5'),('6'),('7'),('8'),('9'),('10')
on conflict do nothing;

-- 2. Drop likes and profile pins on the removed placeholders. They are no longer
--    in the feed, so leaving them would make people "match" on reels nobody can see.
--    Old chat messages with those reels are kept; the app shows "reel unavailable".
delete from public.likes where reel_id in ('1','2','3');
delete from public.profile_reels where reel_id in ('1','2','3');

-- 3. Demo auto-replies used to send reel 1 or 2. Now they send a random registered
--    reel (other than the one they received when possible).
create or replace function public.send_reel(p_target uuid,p_reel text)
returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); reply text;
begin
 if me is null or p_target is null or p_target=me or p_reel is null or char_length(p_reel) not between 1 and 100 or p_reel !~ '^[A-Za-z0-9_-]+$' then raise exception 'Invalid reel or recipient'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(me,p_target)::text || ':' || greatest(me,p_target)::text,0));
 if not exists(select 1 from public.reel_catalog r where r.reel_id=p_reel) then raise exception 'Unknown reel ID. Register it in reel_catalog first'; end if;
 if public.pair_hidden(me,p_target) or not exists(select 1 from public.connections c where c.status='accepted' and ((c.sender_id=me and c.receiver_id=p_target) or (c.receiver_id=me and c.sender_id=p_target))) then raise exception 'You need an accepted connection'; end if;
 insert into public.reel_messages(sender_id,receiver_id,reel_id) values(me,p_target,p_reel);
 -- Explicitly labeled fictional accounts send an automated reel response.
 if exists(select 1 from public.profiles p where p.id=p_target and p.is_demo) then
  select r.reel_id into reply from public.reel_catalog r
  order by (r.reel_id = p_reel), random() limit 1;
  insert into public.reel_messages(sender_id,receiver_id,reel_id,created_at) values(p_target,me,reply,clock_timestamp() + interval '1 millisecond');
 end if;
end; $$;

-- 4. Unregister the placeholders last, so nothing can send them any more.
delete from public.reel_catalog where reel_id in ('1','2','3');

commit;
