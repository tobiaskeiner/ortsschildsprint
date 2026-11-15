-- Webhook events that can never succeed must not be retried forever. After
-- the attempt cap an event is marked processed (abandoned), so the pending
-- retry query skips it and retention pruning eventually removes it. Abandoned
-- events keep their last error for diagnostics; on the failure bias of this
-- integration, abandoning means unconfirmed data is kept, never removed.
-- A rate-limited attempt stores Strava's Retry-After (capped at one hour) as
-- the next retry time instead of the fixed backoff.
create or replace function public.fail_strava_webhook_event(
  event_id_input bigint,
  lock_id_input uuid,
  error_input text,
  retry_after_seconds_input integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_count integer;
begin
  select processing_attempt_count into attempt_count
  from public.strava_webhook_events
  where id = event_id_input
    and processing_lock_id = lock_id_input;

  if attempt_count is null then
    return;
  end if;

  update public.strava_webhook_events
  set
    processing_lock_id = null,
    processing_lock_expires_at = null,
    last_error = left(error_input, 500),
    processed_at = case
      when attempt_count >= 12 then now()
      else processed_at
    end,
    next_retry_at = case
      when attempt_count >= 12 then next_retry_at
      when retry_after_seconds_input is not null
        then now()
             + least(retry_after_seconds_input, 3600) * interval '1 second'
      else now() + case
        when attempt_count <= 1 then interval '1 minute'
        when attempt_count = 2 then interval '2 minutes'
        when attempt_count = 3 then interval '4 minutes'
        when attempt_count = 4 then interval '8 minutes'
        when attempt_count = 5 then interval '16 minutes'
        when attempt_count = 6 then interval '32 minutes'
        else interval '1 hour'
      end
    end
  where id = event_id_input
    and processing_lock_id = lock_id_input;
end;
$$;
