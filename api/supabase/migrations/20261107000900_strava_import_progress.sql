alter table public.strava_import_state
  add column analyzed_ride_count integer not null default 0 check (analyzed_ride_count >= 0);

update public.strava_import_state as state
set analyzed_ride_count = activity_counts.count
from (
  select athlete_id, count(*)::integer as count
  from public.strava_activities
  group by athlete_id
) as activity_counts
where activity_counts.athlete_id = state.athlete_id;
