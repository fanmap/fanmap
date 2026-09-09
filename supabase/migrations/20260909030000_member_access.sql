-- No public table reads, even with an anon key or a forged browser profile.
-- Only the Edge Function's server-side service role may access these tables.
create table if not exists public.fanmap_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  created_at timestamptz not null default now()
);
create table if not exists public.fanmap_member_payload (
  id text primary key check (id = 'directory'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);
create table if not exists public.fanmap_member_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (octet_length(state::text) <= 131072),
  updated_at timestamptz not null default now()
);
create table if not exists public.fanmap_member_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pin jsonb not null check (octet_length(pin::text) <= 4096),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  revoked_at timestamptz
);
create table if not exists public.fanmap_access_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null
);
alter table public.fanmap_profiles enable row level security;
alter table public.fanmap_member_payload enable row level security;
alter table public.fanmap_member_state enable row level security;
alter table public.fanmap_member_shares enable row level security;
alter table public.fanmap_access_limits enable row level security;
revoke all on public.fanmap_profiles, public.fanmap_member_payload, public.fanmap_member_state, public.fanmap_member_shares, public.fanmap_access_limits from public, anon, authenticated;
grant select, insert, update, delete on public.fanmap_profiles, public.fanmap_member_payload, public.fanmap_member_state, public.fanmap_member_shares, public.fanmap_access_limits to service_role;
-- Intentionally no anon/authenticated policies. Direct REST access is denied.
create or replace function public.fanmap_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare display_value text;
begin
  display_value := btrim(new.raw_user_meta_data->>'display_name');
  if display_value is not null and char_length(display_value) between 2 and 60 then
    insert into public.fanmap_profiles(id,display_name) values(new.id,display_value) on conflict(id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.fanmap_create_profile() from public, anon, authenticated;
drop trigger if exists fanmap_profile_on_signup on auth.users;
create trigger fanmap_profile_on_signup after insert on auth.users for each row execute procedure public.fanmap_create_profile();
create or replace function public.fanmap_take_request(member_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  insert into public.fanmap_access_limits(user_id,window_start,request_count) values(member_id,clock_timestamp(),1)
  on conflict (user_id) do update set
    window_start = case when fanmap_access_limits.window_start < clock_timestamp()-interval '60 seconds' then clock_timestamp() else fanmap_access_limits.window_start end,
    request_count = case when fanmap_access_limits.window_start < clock_timestamp()-interval '60 seconds' then 1 else fanmap_access_limits.request_count+1 end
  returning request_count into used;
  return used <= 60;
end;
$$;
revoke all on function public.fanmap_take_request(uuid) from public, anon, authenticated;
grant execute on function public.fanmap_take_request(uuid) to service_role;
