-- The retry-after overload of fail_strava_webhook_event (added with the
-- attempt cap) never had the revoke its sibling functions have, so the
-- SECURITY DEFINER function kept Postgres' default PUBLIC execute grant and
-- was callable by anon and authenticated through PostgREST. Only the Worker,
-- as service_role, may record webhook failures.
revoke all on function public.fail_strava_webhook_event(bigint, uuid, text, integer)
from public, anon, authenticated;

grant execute on function public.fail_strava_webhook_event(bigint, uuid, text, integer)
to service_role;
