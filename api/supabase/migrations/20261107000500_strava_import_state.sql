create table public.strava_import_state (
  athlete_id bigint primary key references public.strava_athletes (athlete_id) on delete cascade,
  next_before_epoch bigint,
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.strava_import_state enable row level security;
