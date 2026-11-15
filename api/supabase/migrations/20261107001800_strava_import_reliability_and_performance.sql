-- Make activity completion and collection writes all-or-nothing, and add the
-- indexes used by the import scheduler and dashboard.

create index if not exists athlete_city_limit_signs_first_activity_id_idx
  on public.athlete_city_limit_signs (first_activity_id);

create index if not exists athlete_city_limit_signs_athlete_collected_at_idx
  on public.athlete_city_limit_signs (athlete_id, collected_at desc, osm_id desc);

-- Keep every observed activity/sign relationship, rather than only the first
-- collection. This lets a deleted or privatized first ride fall back to the
-- next eligible ride that passed the same sign.
create table public.strava_activity_city_limit_signs (
  athlete_id bigint not null references public.strava_athletes (athlete_id) on delete cascade,
  activity_id bigint not null references public.strava_activities (activity_id) on delete cascade,
  osm_id bigint not null,
  activity_started_at timestamptz not null,
  primary key (athlete_id, activity_id, osm_id)
);

alter table public.strava_activity_city_limit_signs enable row level security;

create index strava_activity_city_limit_signs_athlete_osm_started_at_idx
  on public.strava_activity_city_limit_signs (
    athlete_id,
    osm_id,
    activity_started_at,
    activity_id
  );

-- Preserve already-collected signs when this migration is applied to an
-- existing integration. Older imports cannot recover repeat visits, but their
-- known first activity remains available for deletion handling.
insert into public.strava_activity_city_limit_signs (
  athlete_id,
  activity_id,
  osm_id,
  activity_started_at
)
select
  athlete_id,
  first_activity_id,
  osm_id,
  collected_at
from public.athlete_city_limit_signs
on conflict (athlete_id, activity_id, osm_id) do nothing;

create index if not exists strava_import_state_pending_history_idx
  on public.strava_import_state (updated_at)
  where full_history_requested and not completed;

alter table public.strava_webhook_events
  add column if not exists processing_lock_id uuid,
  add column if not exists processing_lock_expires_at timestamptz,
  add column if not exists processing_attempt_count integer not null default 0
    check (processing_attempt_count >= 0),
  add column if not exists next_retry_at timestamptz not null default now(),
  add column if not exists last_error text;

create index if not exists strava_webhook_events_pending_idx
  on public.strava_webhook_events (next_retry_at, id)
  where processed_at is null;

create or replace function public.complete_strava_activity(
  athlete_id_input bigint,
  activity_id_input bigint,
  activity_started_at_input timestamptz,
  matched_osm_ids_input bigint[]
)
returns table (
  already_processed boolean,
  new_sign_count integer,
  description_updated boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_activity_id bigint;
  existing_activity public.strava_activities%rowtype;
  inserted_sign_count integer := 0;
begin
  if activity_started_at_input is null then
    raise exception 'Activity start time is required';
  end if;

  insert into public.strava_activities (activity_id, athlete_id)
  values (activity_id_input, athlete_id_input)
  on conflict (activity_id) do nothing
  returning activity_id into inserted_activity_id;

  if inserted_activity_id is null then
    select * into existing_activity
    from public.strava_activities
    where activity_id = activity_id_input;

    if existing_activity.athlete_id <> athlete_id_input then
      raise exception 'Activity belongs to a different athlete';
    end if;

    return query
    select
      true,
      existing_activity.new_sign_count,
      existing_activity.description_updated;
    return;
  end if;

  insert into public.strava_activity_city_limit_signs (
    athlete_id,
    activity_id,
    osm_id,
    activity_started_at
  )
  select
    athlete_id_input,
    activity_id_input,
    sign.osm_id,
    activity_started_at_input
  from (
    select distinct osm_id
    from unnest(coalesce(matched_osm_ids_input, '{}'::bigint[])) as sign(osm_id)
    where osm_id is not null
  ) as sign
  on conflict (athlete_id, activity_id, osm_id) do nothing;

  with matched_signs as (
    select distinct osm_id
    from unnest(coalesce(matched_osm_ids_input, '{}'::bigint[])) as sign(osm_id)
    where osm_id is not null
  ), inserted_signs as (
    insert into public.athlete_city_limit_signs (
      athlete_id,
      osm_id,
      first_activity_id,
      collected_at
    )
    select
      athlete_id_input,
      matched_signs.osm_id,
      activity_id_input,
      activity_started_at_input
    from matched_signs
    on conflict (athlete_id, osm_id) do nothing
    returning osm_id
  )
  select count(*)::integer into inserted_sign_count
  from inserted_signs;

  -- Historic imports are newest-to-oldest. Keep the genuine first collection
  -- when an older matching activity is imported after a newer one.
  update public.athlete_city_limit_signs as collected_sign
  set
    first_activity_id = activity_id_input,
    collected_at = activity_started_at_input
  from (
    select distinct osm_id
    from unnest(coalesce(matched_osm_ids_input, '{}'::bigint[])) as sign(osm_id)
    where osm_id is not null
  ) as matched_signs
  where collected_sign.athlete_id = athlete_id_input
    and collected_sign.osm_id = matched_signs.osm_id
    and collected_sign.collected_at > activity_started_at_input;

  update public.strava_activities
  set new_sign_count = inserted_sign_count
  where activity_id = activity_id_input;

  return query select false, inserted_sign_count, false;
end;
$$;

create or replace function public.remove_strava_activity_collection(
  athlete_id_input bigint,
  activity_id_input bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_osm_ids bigint[];
begin
  -- Include canonical rows as well as mappings so records created before the
  -- mapping table can still be removed safely.
  select array_agg(osm_id) into affected_osm_ids
  from (
    select activity_sign.osm_id
    from public.strava_activity_city_limit_signs as activity_sign
    where activity_sign.athlete_id = athlete_id_input
      and activity_sign.activity_id = activity_id_input
    union
    select collected_sign.osm_id
    from public.athlete_city_limit_signs as collected_sign
    where collected_sign.athlete_id = athlete_id_input
      and collected_sign.first_activity_id = activity_id_input
  ) as affected_sign;

  delete from public.strava_activity_city_limit_signs
  where athlete_id = athlete_id_input
    and activity_id = activity_id_input;

  if affected_osm_ids is not null then
    -- Only canonical rows owned by the removed activity need replacement.
    -- Rows owned by an older, legacy activity remain intact even if this
    -- removed activity also matched the sign.
    delete from public.athlete_city_limit_signs
    where athlete_id = athlete_id_input
      and first_activity_id = activity_id_input
      and osm_id = any(affected_osm_ids);

    insert into public.athlete_city_limit_signs (
      athlete_id,
      osm_id,
      first_activity_id,
      collected_at
    )
    select distinct on (activity_sign.osm_id)
      athlete_id_input,
      activity_sign.osm_id,
      activity_sign.activity_id,
      activity_sign.activity_started_at
    from public.strava_activity_city_limit_signs as activity_sign
    where activity_sign.athlete_id = athlete_id_input
      and activity_sign.osm_id = any(affected_osm_ids)
    order by
      activity_sign.osm_id,
      activity_sign.activity_started_at,
      activity_sign.activity_id
    on conflict (athlete_id, osm_id) do nothing;
  end if;

  delete from public.strava_activities
  where athlete_id = athlete_id_input
    and activity_id = activity_id_input;
end;
$$;

create or replace function public.claim_strava_webhook_event(
  event_id_input bigint,
  lock_id_input uuid
)
returns table (
  id bigint,
  object_type text,
  object_id bigint,
  aspect_type text,
  owner_id bigint,
  event_time timestamptz,
  updates jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.strava_webhook_events as webhook_event
  set
    processing_lock_id = lock_id_input,
    processing_lock_expires_at = now() + interval '10 minutes',
    processing_attempt_count = webhook_event.processing_attempt_count + 1
  where webhook_event.id = event_id_input
    and webhook_event.processed_at is null
    and webhook_event.next_retry_at <= now()
    and (
      webhook_event.processing_lock_expires_at is null
      or webhook_event.processing_lock_expires_at <= now()
    )
  returning
    webhook_event.id,
    webhook_event.object_type,
    webhook_event.object_id,
    webhook_event.aspect_type,
    webhook_event.owner_id,
    webhook_event.event_time,
    webhook_event.updates;
end;
$$;

create or replace function public.complete_strava_webhook_event(
  event_id_input bigint,
  lock_id_input uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.strava_webhook_events
  set
    processed_at = now(),
    processing_lock_id = null,
    processing_lock_expires_at = null,
    last_error = null
  where id = event_id_input
    and processing_lock_id = lock_id_input
$$;

create or replace function public.fail_strava_webhook_event(
  event_id_input bigint,
  lock_id_input uuid,
  error_input text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.strava_webhook_events
  set
    processing_lock_id = null,
    processing_lock_expires_at = null,
    last_error = left(error_input, 500),
    next_retry_at = now() + case
      when processing_attempt_count <= 1 then interval '1 minute'
      when processing_attempt_count = 2 then interval '2 minutes'
      when processing_attempt_count = 3 then interval '4 minutes'
      when processing_attempt_count = 4 then interval '8 minutes'
      when processing_attempt_count = 5 then interval '16 minutes'
      when processing_attempt_count = 6 then interval '32 minutes'
      else interval '1 hour'
    end
  where id = event_id_input
    and processing_lock_id = lock_id_input
$$;

revoke all on function public.complete_strava_activity(bigint, bigint, timestamptz, bigint[])
from public, anon, authenticated;
revoke all on function public.remove_strava_activity_collection(bigint, bigint)
from public, anon, authenticated;
revoke all on function public.claim_strava_webhook_event(bigint, uuid)
from public, anon, authenticated;
revoke all on function public.complete_strava_webhook_event(bigint, uuid)
from public, anon, authenticated;
revoke all on function public.fail_strava_webhook_event(bigint, uuid, text)
from public, anon, authenticated;

grant execute on function public.complete_strava_activity(bigint, bigint, timestamptz, bigint[])
to service_role;
grant execute on function public.remove_strava_activity_collection(bigint, bigint)
to service_role;
grant execute on function public.claim_strava_webhook_event(bigint, uuid)
to service_role;
grant execute on function public.complete_strava_webhook_event(bigint, uuid)
to service_role;
grant execute on function public.fail_strava_webhook_event(bigint, uuid, text)
to service_role;
