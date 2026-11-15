-- Gate the ride-total history scan behind a claim so concurrent dashboard
-- loads do not duplicate the multi-page scan, and a failed scan backs off
-- instead of re-running on every dashboard load.
alter table public.strava_import_state
  add column total_ride_count_refreshing boolean not null default false,
  add column total_ride_count_refresh_started_at timestamptz;

create or replace function public.claim_total_ride_count_refresh(
  athlete_id_input bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  update public.strava_import_state
  set
    total_ride_count_refreshing = true,
    total_ride_count_refresh_started_at = now()
  where athlete_id = athlete_id_input
    and total_ride_count is null
    and (
      not total_ride_count_refreshing
      or total_ride_count_refresh_started_at < now() - interval '10 minutes'
    );

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

create or replace function public.complete_total_ride_count_refresh(
  athlete_id_input bigint,
  total_ride_count_input integer
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.strava_import_state
  set
    total_ride_count = total_ride_count_input,
    total_ride_count_refreshing = false,
    total_ride_count_refresh_started_at = null
  where athlete_id = athlete_id_input
    and total_ride_count is null;
$$;

revoke all on function public.claim_total_ride_count_refresh(bigint)
from public, anon, authenticated;
revoke all on function public.complete_total_ride_count_refresh(bigint, integer)
from public, anon, authenticated;

grant execute on function public.claim_total_ride_count_refresh(bigint)
to service_role;
grant execute on function public.complete_total_ride_count_refresh(bigint, integer)
to service_role;
