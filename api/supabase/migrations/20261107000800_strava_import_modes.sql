alter table public.strava_import_state
  add column initial_import_complete boolean not null default false,
  add column full_history_requested boolean not null default false;
