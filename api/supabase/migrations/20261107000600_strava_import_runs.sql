create table public.strava_import_runs (
  hour_started_at timestamptz primary key,
  athlete_id bigint not null references public.strava_athletes (athlete_id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.strava_import_runs enable row level security;
