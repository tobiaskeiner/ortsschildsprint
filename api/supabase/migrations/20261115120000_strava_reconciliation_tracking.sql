-- Tracks when a connected athlete's newest rides were last reconciled, so the
-- scheduler can round-robin a catch-up scan across all connected athletes and
-- recover rides whose webhook delivery was missed without waiting for an
-- Import request.
alter table public.strava_import_state
  add column last_reconciled_at timestamptz;
