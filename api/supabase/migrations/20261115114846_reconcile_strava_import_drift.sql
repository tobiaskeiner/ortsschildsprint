-- Reconcile drift between the deployed database and the migration files: the
-- reliability/performance migration was applied from an earlier revision that
-- did not yet create the activity/sign mapping table or the updated completion
-- and removal functions. Its indexes and webhook-event columns are already
-- present, so only the missing pieces are created here.
--
-- This file reproduces the migration that was applied to the remote project
-- as version 20261115114846, so migration history and the repo stay in sync.

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

-- Preserve already-collected signs. Older imports cannot recover repeat
-- visits, but their known first activity remains available for deletion
-- handling.
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

revoke all on function public.complete_strava_activity(bigint, bigint, timestamptz, bigint[])
from public, anon, authenticated;
revoke all on function public.remove_strava_activity_collection(bigint, bigint)
from public, anon, authenticated;

grant execute on function public.complete_strava_activity(bigint, bigint, timestamptz, bigint[])
to service_role;
grant execute on function public.remove_strava_activity_collection(bigint, bigint)
to service_role;
