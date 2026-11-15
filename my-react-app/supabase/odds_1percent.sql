begin;

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
 won := random() < 0.01;
 until_time := case when won then null else now() + interval '7 days' end;
 update public.reject_roulette set hidden=won,locked_until=until_time where user_id=me and target_id=p_target;
 return jsonb_build_object('outcome',case when won then 'won' else 'lost' end,'locked_until',until_time);
end; $$;

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
 won := random() < 0.01;
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

commit;
