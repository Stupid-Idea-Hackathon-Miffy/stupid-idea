-- Run once on the existing Reel Love database (after setup, upgrade, profile_reels).
-- Refresh seeded profiles and switch fully to the seven current video IDs.
-- Actual signed-in profiles and their current-video likes/pins are untouched.
-- Obsolete placeholder likes/pins are removed; old chat history is retained.
begin;
insert into public.reel_catalog(reel_id) values ('4'),('5'),('6'),('7'),('8'),('9'),('10') on conflict do nothing;
create temporary table rl_seed (id uuid primary key, name text, age integer, bio text, interests text[], avatar text, liked text[], pinned text[]) on commit drop;
insert into rl_seed values
(md5('reelmate-demo-v2:maya')::uuid,'your mom',23,'no',array['cats','food']::text[],'pfp1',array['4','5']::text[],array['4','5']::text[]),
(md5('reelmate-demo-v2:adam')::uuid,'unc',28,'im outside sometimes',array['football','music']::text[],'pfp5',array['4','6']::text[],array['6','4']::text[]),
(md5('reelmate-demo-v2:nina')::uuid,'mo',22,'send it',array['gaming','memes']::text[],'pfp9',array['4','7']::text[],array['4','7']::text[]),
(md5('reelmate-demo-v2:leo')::uuid,'toaster',21,'i was told to make an account',array['music','cooking']::text[],'pfp2',array['4','8']::text[],array['8','4']::text[]),
(md5('reelmate-demo-v2:sara')::uuid,'soup',20,'currently eating cereal',array['food','cats']::text[],'pfp7',array['4','9']::text[],array['4','9']::text[]),
(md5('reelmate-demo-v2:zain')::uuid,'big steve',24,'6 ft on a good day',array['gym','football']::text[],'pfp10',array['4','10']::text[],array['10','4']::text[]),
(md5('reelmate-demo-v2:milo')::uuid,'idk',21,'hi',array['gaming']::text[],'pfp4',array['5','6']::text[],array['5','6']::text[]),
(md5('reelmate-demo-v2:lina')::uuid,'mimi',22,'i like cats',array['cats','art']::text[],'pfp8',array['5','7']::text[],array['7','5']::text[]),
(md5('reelmate-demo-v2:noah')::uuid,'greg',25,'i work nights',array['music','food']::text[],'pfp2',array['5','8']::text[],array['5','8']::text[]),
(md5('reelmate-demo-v2:rory')::uuid,'meep',20,'what',array['memes','gaming']::text[],'pfp7',array['5','9']::text[],array['9','5']::text[]),
(md5('reelmate-demo-v2:jules')::uuid,'potato',23,'do not ask me to go running',array['food','movies']::text[],'pfp10',array['5','10']::text[],array['5','10']::text[]),
(md5('reelmate-demo-v2:omar')::uuid,'sami',22,'ottawa',array['football','music']::text[],'pfp4',array['6','7']::text[],array['7','6']::text[]),
(md5('reelmate-demo-v2:bea')::uuid,'rat',21,'just here',array['cats','memes']::text[],'pfp8',array['6','8']::text[],array['6','8']::text[]),
(md5('reelmate-demo-v2:kai')::uuid,'jules',24,'i have a switch',array['gaming','art']::text[],'pfp1',array['6','9']::text[],array['9','6']::text[]),
(md5('reelmate-demo-v2:dani')::uuid,'bob',27,'looking for something normal',array['music','walking']::text[],'pfp5',array['6','10']::text[],array['6','10']::text[]),
(md5('reelmate-demo-v2:ilyas')::uuid,'yap',20,'i have a lot to say',array['memes','college']::text[],'pfp9',array['7','8']::text[],array['8','7']::text[]),
(md5('reelmate-demo-v2:emi')::uuid,'lulu',23,'usually asleep',array['cats','music']::text[],'pfp4',array['7','9']::text[],array['7','9']::text[]),
(md5('reelmate-demo-v2:max')::uuid,'tiffany',24,'i make good pasta',array['food','movies']::text[],'pfp8',array['7','10']::text[],array['10','7']::text[]),
(md5('reelmate-demo-v2:finn')::uuid,'where am i',21,'i forgot',array['memes','gaming']::text[],'pfp1',array['8','9']::text[],array['8','9']::text[]),
(md5('reelmate-demo-v2:zoe')::uuid,'milk',22,'not much',array['music','cats']::text[],'pfp5',array['8','10']::text[],array['10','8']::text[]),
(md5('reelmate-demo-v2:amir')::uuid,'kevin',25,'i play minecraft',array['minecraft','gaming']::text[],'pfp9',array['9','10']::text[],array['9','10']::text[]),
(md5('reelmate-demo-v2:poppy')::uuid,'nora',22,'films and matcha',array['film','coffee']::text[],'pfp2',array['4','5','7']::text[],array['4','5','7']::text[]),
(md5('reelmate-demo-v2:remy')::uuid,'ham',23,'send me the cat one',array['cats','memes']::text[],'pfp7',array['4','6','8']::text[],array['6','8']::text[]),
(md5('reelmate-demo-v2:ash')::uuid,'sarah',21,'i dont check this much',array['art','music']::text[],'pfp10',array['5','7','9']::text[],array['9','5','7']::text[]),
(md5('reel-love-v3:25')::uuid,'bro',22,'???',array['memes','football']::text[],'pfp5',array['6','8','10']::text[],array['6','8']::text[]),
(md5('reel-love-v3:26')::uuid,'jimbo',26,'i just got off work',array['music','food']::text[],'pfp9',array['4','9','10']::text[],array['9','10','4']::text[]),
(md5('reel-love-v3:27')::uuid,'aaa',20,'sure',array['gaming','memes']::text[],'pfp2',array['5','6','10']::text[],array['10','5']::text[]),
(md5('reel-love-v3:28')::uuid,'momo',24,'i like long walks',array['walking','cats']::text[],'pfp7',array['7','8','9']::text[],array['7','8','9']::text[]),
(md5('reel-love-v3:29')::uuid,'chair',22,'depends',array['memes','gaming']::text[],'pfp10',array['4','5','6','7']::text[],array['4','5']::text[]),
(md5('reel-love-v3:30')::uuid,'z',23,'no bio',array['music']::text[],'pfp4',array['5','7','8','9']::text[],array['7','8','9']::text[]),
(md5('reel-love-v3:31')::uuid,'dawg',21,'i live on my phone',array['memes','football']::text[],'pfp8',array['4','6','9','10']::text[],array['9','10']::text[]),
(md5('reel-love-v3:32')::uuid,'beep',20,'low battery',array['gaming','memes']::text[],'pfp1',array['4','5','7','8','10']::text[],array['5','7','8']::text[]),
(md5('reel-love-v3:33')::uuid,'nathan',24,'i need to sleep',array['music','movies']::text[],'pfp7',array['5','6','7','9','10']::text[],array['7','9']::text[]),
(md5('reel-love-v3:34')::uuid,'unknown',22,'dont know what to put',array['memes','food']::text[],'pfp10',array['4','5','6','7','8','10']::text[],array['7','8','10']::text[]),
(md5('reel-love-v3:35')::uuid,'basil',23,'i like plants',array['plants','cats']::text[],'pfp4',array['4','5','6','7','8','9']::text[],array['8','9']::text[]),
(md5('reel-love-v3:36')::uuid,'margaret',25,'hey',array['art','music']::text[],'pfp8',array['4','5','6','7','8','9','10']::text[],array['4','5','6']::text[]),
(md5('reel-love-v3:37')::uuid,'user 67',21,'real',array['brainrot','memes']::text[],'pfp1',array['4','5','6','7','8','9','10']::text[],array['5','6']::text[]),
(md5('reel-love-v3:38')::uuid,'ok',22,'ok',array['memes']::text[],'pfp5',array['4','5','6','7','8','9','10']::text[],array['6','7','8']::text[]);
-- Never overwrite a real account, even if an unexpected ID collision occurs.
do $$ begin
 if exists (select 1 from rl_seed s join public.profiles p on p.id=s.id where not p.is_demo or p.auth_id is not null) then
   raise exception 'Seed ID collision with signed-in profile; no changes applied';
 end if;
end $$;
-- Keep the UUIDs (and therefore existing connections) of the original 24 seeded profiles.
insert into public.profiles(id,name,age,bio,interests,avatar,is_demo)
select id,name,age,bio,interests,avatar,true from rl_seed
on conflict (id) do update set name=excluded.name,age=excluded.age,bio=excluded.bio,interests=excluded.interests,avatar=excluded.avatar;
-- Remove older seeded records not in the new roster; foreign keys cascade for those records only.
delete from public.profiles p where p.is_demo and p.auth_id is null and not exists(select 1 from rl_seed s where s.id=p.id);
-- Clear outdated histories from seeded profiles and legacy placeholder IDs from all profiles.
delete from public.likes l where l.reel_id in ('1','2','3') or exists(select 1 from rl_seed s where s.id=l.user_id);
delete from public.profile_reels r where r.reel_id in ('1','2','3') or exists(select 1 from rl_seed s where s.id=r.user_id);
insert into public.likes(user_id,reel_id) select s.id,r.reel_id from rl_seed s cross join lateral unnest(s.liked) r(reel_id);
insert into public.profile_reels(user_id,reel_id) select s.id,r.reel_id from rl_seed s cross join lateral unnest(s.pinned) r(reel_id);
-- Auto replies use only the current video IDs, not old placeholder IDs.
create or replace function public.send_reel(p_target uuid,p_reel text)
returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); reply text;
begin
 if me is null or p_target is null or p_target=me or p_reel is null or char_length(p_reel) not between 1 and 100 or p_reel !~ '^[A-Za-z0-9_-]+$' then raise exception 'Invalid reel or recipient'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(me,p_target)::text || ':' || greatest(me,p_target)::text,0));
 if not exists(select 1 from public.reel_catalog r where r.reel_id=p_reel) then raise exception 'Unknown reel ID'; end if;
 if public.pair_hidden(me,p_target) or not exists(select 1 from public.connections c where c.status='accepted' and ((c.sender_id=me and c.receiver_id=p_target) or (c.receiver_id=me and c.sender_id=p_target))) then raise exception 'You need an accepted connection'; end if;
 insert into public.reel_messages(sender_id,receiver_id,reel_id) values(me,p_target,p_reel);
 if exists(select 1 from public.profiles p where p.id=p_target and p.is_demo) then
  select r.reel_id into reply from public.reel_catalog r where r.reel_id in ('4','5','6','7','8','9','10') order by (r.reel_id=p_reel), random() limit 1;
  if reply is not null then insert into public.reel_messages(sender_id,receiver_id,reel_id,created_at) values(p_target,me,reply,clock_timestamp()+interval '1 millisecond'); end if;
 end if;
end; $$;
revoke all on function public.send_reel(uuid,text) from public,anon;
grant execute on function public.send_reel(uuid,text) to authenticated;
delete from public.reel_catalog where reel_id in ('1','2','3');
select s.name,cardinality(s.liked) as liked_reels,cardinality(s.pinned) as pinned_reels from rl_seed s order by liked_reels,s.name;
commit;
