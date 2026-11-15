alter table public.strava_import_state
  add column if not exists total_ride_count integer
    check (total_ride_count >= 0);
