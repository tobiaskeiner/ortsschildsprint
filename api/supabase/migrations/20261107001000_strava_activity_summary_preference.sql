-- Existing connected athletes previously received activity summaries by
-- default. Keep that behaviour for them while allowing new connections to
-- make the choice explicitly.
alter table public.strava_athletes
  add column if not exists append_sign_summary boolean not null default true;
