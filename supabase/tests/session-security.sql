begin;
do $$
declare uid uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); other_uid uuid:=gen_random_uuid();
begin
  perform set_config('fanmap.test_uid',uid::text,true);
  perform set_config('fanmap.test_sid',sid::text,true);
  perform set_config('fanmap.test_other_uid',other_uid::text,true);
  insert into auth.users(id,aud,role,email,email_confirmed_at,raw_user_meta_data)
    values(uid,'authenticated','authenticated',uid::text||'@example.invalid',now(),'{"display_name":"FanMap test"}');
  if not exists(select 1 from public.fanmap_profiles where id=uid) then raise exception 'Profile trigger failed'; end if;
  insert into auth.sessions(id,user_id,not_after) values(sid,uid,now()+interval '1 hour');
end $$;
set local role service_role;
do $$
begin
  if not public.fanmap_session_active(current_setting('fanmap.test_uid')::uuid,current_setting('fanmap.test_sid')::uuid) then raise exception 'Valid session denied'; end if;
  if public.fanmap_session_active(current_setting('fanmap.test_other_uid')::uuid,current_setting('fanmap.test_sid')::uuid) then raise exception 'Wrong owner allowed'; end if;
end $$;
reset role;
update auth.sessions set not_after=now()-interval '1 second' where id=current_setting('fanmap.test_sid')::uuid;
do $$ begin
  if public.fanmap_session_active(current_setting('fanmap.test_uid')::uuid,current_setting('fanmap.test_sid')::uuid) then raise exception 'Expired session allowed'; end if;
end $$;
update auth.sessions set not_after=null where id=current_setting('fanmap.test_sid')::uuid;
update auth.users set banned_until=now()+interval '1 hour' where id=current_setting('fanmap.test_uid')::uuid;
do $$ begin
  if public.fanmap_session_active(current_setting('fanmap.test_uid')::uuid,current_setting('fanmap.test_sid')::uuid) then raise exception 'Banned user allowed'; end if;
end $$;
update auth.users set banned_until=null where id=current_setting('fanmap.test_uid')::uuid;
delete from auth.sessions where id=current_setting('fanmap.test_sid')::uuid;
do $$ begin
  if public.fanmap_session_active(current_setting('fanmap.test_uid')::uuid,current_setting('fanmap.test_sid')::uuid) then raise exception 'Revoked session allowed'; end if;
end $$;
select 'PASS: profile creation; valid, wrong-owner, expired, banned and revoked session checks. All fixtures rolled back.' as result;
rollback;
