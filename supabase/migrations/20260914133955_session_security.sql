-- Sensitive auth lookups stay outside the exposed schema. No browser role may
-- call either the private function or its service-only PostgREST wrapper.
create schema if not exists fanmap_private;
revoke all on schema fanmap_private from public, anon, authenticated;
grant usage on schema fanmap_private to service_role;

create or replace function fanmap_private.session_active(member_id uuid, session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id=session_id and s.user_id=member_id
      and (s.not_after is null or s.not_after>now())
      and (u.banned_until is null or u.banned_until<=now())
      and u.deleted_at is null
  );
$$;
revoke all on function fanmap_private.session_active(uuid,uuid) from public, anon, authenticated;
grant execute on function fanmap_private.session_active(uuid,uuid) to service_role;

create or replace function public.fanmap_session_active(member_id uuid, session_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select fanmap_private.session_active(member_id,session_id);
$$;
revoke all on function public.fanmap_session_active(uuid,uuid) from public, anon, authenticated;
grant execute on function public.fanmap_session_active(uuid,uuid) to service_role;

alter function public.fanmap_take_request(uuid) security invoker;
alter function public.fanmap_create_profile() set schema fanmap_private;
create index if not exists fanmap_member_shares_owner_idx on public.fanmap_member_shares(owner_id);
