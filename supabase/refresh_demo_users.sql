-- ReelMate: replace fictional demo profiles only. Run in the Supabase SQL Editor.
-- Existing real users and their likes are preserved; old demo relationships/messages
-- are removed by ON DELETE CASCADE. Run once before the demo, not between demos.
-- Every profile is fictional and all ages are 18+.
begin;

-- Use the actual registered reel IDs (including any new ones already registered).
-- Prefer the original three IDs for predictable matches with the original feed.
create temporary table rm_seed_catalog on commit drop as
select reel_id, row_number() over (order by
  case reel_id when '1' then 0 when '2' then 1 when '3' then 2 else 3 end,
  length(reel_id), reel_id)::integer as pos
from public.reel_catalog;

do $$ begin
  if (select count(*) from rm_seed_catalog) < 2 then
    raise exception 'Register at least two actual reel IDs in public.reel_catalog before running this seed.';
  end if;
end $$;

create temporary table rm_seed_profiles (
  name text primary key, age integer, bio text, interests text[], avatar text,
  pattern text, pin_count integer
) on commit drop;

insert into rm_seed_profiles values
-- low exposure: one liked reel (won't match until there is enough shared activity)
('maya', 22, 'i open this app by accident when i try to check the weather.', array['reading','coffee','walks'], 'pfp8', 'one', 1),
('adam', 24, 'my screen time is 48 min and most of it is google maps.', array['gym','cooking','maps'], 'pfp4', 'one', 1),
('nina', 21, 'my friend made me download this. hi i guess', array['film','thrifting'], 'pfp7', 'one', 1),
('leo', 23, 'i have notifications turned off. radical concept ik', array['hiking','music'], 'pfp2', 'one', 1),
-- original-feed pairs: reliably give demo matches for any 2 of IDs 1,2,3
('sara', 20, 'if the cat is ugly enough im liking it', array['ugly cats','baking','memes'], 'pfp7', 'pair12', 2),
('zain', 22, 'i exclusively send videos with 4 pixels', array['football','low quality videos'], 'pfp1', 'pair12', 2),
('milo', 21, 'i have never skipped a dog video in my life', array['dogs','gaming'], 'pfp8', 'pair13', 2),
('lina', 23, 'i just need someone to send my 2am discoveries to', array['animals','late night scrolling'], 'pfp5', 'pair13', 2),
('noah', 25, 'i watch reels with the sound off and still laugh', array['birds','cats','comedy'], 'pfp10', 'pair23', 2),
('rory', 20, 'yes i watched that whole thing. twice.', array['pets','edits'], 'pfp9', 'pair23', 2),
-- broader liking histories, scaled to the number of registered reels
('jules', 22, 'i sent u a reel 3 business days ago pls respond', array['memes','matcha','gaming'], 'pfp5', 'half', 2),
('omar', 23, 'for u page looks like a fever dream rn', array['football edits','shitposts'], 'pfp4', 'half', 2),
('bea', 21, 'i keep saving recipes im never gonna make', array['food','cats','cooking fails'], 'pfp8', 'half', 2),
('kai', 24, 'i know every sound but not a single song', array['edits','music','memes'], 'pfp2', 'half', 2),
('dani', 22, 'reels during lectures. reels after lectures. no notes.', array['college memes','gaming'], 'pfp1', 'most', 2),
('ilyas', 20, 'i say references out loud and nobody gets them', array['brain rot','football','edits'], 'pfp4', 'most', 3),
('emi', 23, 'i use my phone flashlight to find my phone', array['cats','random videos'], 'pfp7', 'most', 2),
('max', 25, 'i have a folder of reels to send to my future wife', array['romantic memes','dogs'], 'pfp8', 'most', 3),
-- fully cooked: like every registered reel
('finn', 21, 'i know the lore behind every comment section', array['brain rot','lore','shitposts'], 'pfp1', 'all', 3),
('zoe', 22, 'my frontal lobe has left the group chat', array['italian brainrot','edits','memes'], 'pfp9', 'all', 3),
('amir', 24, '67 is a perfectly normal number to me (lying)', array['67','football','brain rot'], 'pfp2', 'all', 3),
('poppy', 20, 'my love language is flooding ur dms until ur phone overheats', array['cats','bed rotting'], 'pfp7', 'all', 3),
('remy', 23, 'my phone asked if i was ok. i said mind ur business', array['reaction pics','doomscrolling'], 'pfp10', 'all', 3),
('ash', 22, 'the reel was 6 seconds long. i watched it for 40 minutes.', array['loops','memes','gaming'], 'pfp5', 'all', 3);

-- The demo flag and absent auth_id distinguish fictional records from signed-in users.
delete from public.profiles where is_demo = true and auth_id is null;

insert into public.profiles (id, name, age, bio, interests, avatar, is_demo)
select md5('reelmate-demo-v2:' || name)::uuid, name, age, bio, interests, avatar, true
from rm_seed_profiles;

-- Stable pseudorandom subsets for each seed profile, without fabricating reel IDs.
create temporary table rm_seed_likes on commit drop as
with ranked as (
  select md5('reelmate-demo-v2:' || p.name)::uuid as user_id,
    c.reel_id, c.pos, p.pattern, p.pin_count,
    row_number() over (partition by p.name order by md5(p.name || ':' || c.reel_id), c.reel_id) as rank_no,
    count(*) over (partition by p.name) as catalog_size
  from rm_seed_profiles p cross join rm_seed_catalog c
)
select user_id, reel_id, pin_count, rank_no from ranked
where case pattern
  when 'one' then rank_no = 1
  when 'pair12' then pos in (1,2)
  when 'pair13' then pos in (1,3) or (catalog_size = 2 and pos = 2)
  when 'pair23' then pos in (2,3) or (catalog_size = 2 and pos = 1)
  when 'half' then rank_no <= greatest(2, ceil(catalog_size * 0.50))
  when 'most' then rank_no <= greatest(2, ceil(catalog_size * 0.85))
  when 'all' then true
  else false end;

insert into public.likes(user_id,reel_id)
select user_id,reel_id from rm_seed_likes;

-- Populate the optional profile reel gallery using reels each demo user actually liked.
do $$ begin
  if to_regclass('public.profile_reels') is not null then
    insert into public.profile_reels(user_id,reel_id)
    select user_id,reel_id from (
      select s.*, row_number() over (partition by user_id order by rank_no) as pin_no
      from rm_seed_likes s
    ) chosen where pin_no <= pin_count;
  end if;
end $$;

-- Quick verification in the SQL editor (counts are actual, not hardcoded match scores).
select p.name, p.age, s.pattern as seed_type, count(l.reel_id) as liked_reels
from public.profiles p join rm_seed_profiles s on p.id=md5('reelmate-demo-v2:' || s.name)::uuid
left join public.likes l on l.user_id=p.id
group by p.name,p.age,s.pattern order by liked_reels,p.name;
commit;
