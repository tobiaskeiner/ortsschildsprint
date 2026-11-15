alter table public.strava_import_state
  add column import_lock_id uuid,
  add column import_lock_expires_at timestamptz;

create or replace function public.claim_strava_import_lock(
  athlete_id_input bigint,
  lock_id_input uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  insert into public.strava_import_state (athlete_id)
  values (athlete_id_input)
  on conflict (athlete_id) do nothing;

  update public.strava_import_state
  set
    import_lock_id = lock_id_input,
    import_lock_expires_at = now() + interval '10 minutes'
  where athlete_id = athlete_id_input
    and (
      import_lock_expires_at is null
      or import_lock_expires_at <= now()
    );

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

create or replace function public.release_strava_import_lock(
  athlete_id_input bigint,
  lock_id_input uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.strava_import_state
  set import_lock_id = null, import_lock_expires_at = null
  where athlete_id = athlete_id_input
    and import_lock_id = lock_id_input;
$$;

create table public.signs_rate_limit_windows (
  client_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);

alter table public.signs_rate_limit_windows enable row level security;

create index signs_rate_limit_windows_window_started_at_idx
  on public.signs_rate_limit_windows (window_started_at);

create or replace function public.consume_signs_rate_limit(
  client_key_input text,
  max_requests_input integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if length(client_key_input) > 64
    or max_requests_input < 1
    or max_requests_input > 1_000 then
    raise exception 'Invalid rate-limit input';
  end if;

  -- A rate-limit key is only useful for the current minute. Keep a small
  -- retention buffer for clock skew and remove stale keys during normal use.
  delete from public.signs_rate_limit_windows
  where window_started_at < date_trunc('minute', now()) - interval '1 day';

  insert into public.signs_rate_limit_windows as rate_limit (
    client_key,
    window_started_at,
    request_count
  )
  values (client_key_input, date_trunc('minute', now()), 1)
  on conflict (client_key) do update
  set
    window_started_at = case
      when rate_limit.window_started_at < date_trunc('minute', now())
        then date_trunc('minute', now())
      else rate_limit.window_started_at
    end,
    request_count = case
      when rate_limit.window_started_at < date_trunc('minute', now()) then 1
      else rate_limit.request_count + 1
    end
  returning request_count into current_count;

  return current_count <= max_requests_input;
end;
$$;

revoke all on function public.claim_strava_import_lock(bigint, uuid)
from public, anon, authenticated;
revoke all on function public.release_strava_import_lock(bigint, uuid)
from public, anon, authenticated;
revoke all on function public.consume_signs_rate_limit(text, integer)
from public, anon, authenticated;

grant execute on function public.claim_strava_import_lock(bigint, uuid)
to service_role;
grant execute on function public.release_strava_import_lock(bigint, uuid)
to service_role;
grant execute on function public.consume_signs_rate_limit(text, integer)
to service_role;
