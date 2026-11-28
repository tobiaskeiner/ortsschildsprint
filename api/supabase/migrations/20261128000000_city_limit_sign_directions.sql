-- Which side of each city-limit sign is inside the town, computed offline by
-- scripts/compute-sign-directions.mjs. Kept apart from city_limit_signs so a
-- sign refresh never depends on (or wipes) a direction run, and keyed by the
-- stable OSM id so rows survive sign refreshes. A sign without a row is
-- treated as "unknown" by the frontend, which is the behaviour before this.

create table public.city_limit_sign_directions (
  osm_id bigint primary key,
  -- Compass bearing (degrees from north) of the road direction that leads
  -- into the town. Riding along it passes the sign as an entry.
  inside_bearing smallint not null check (inside_bearing between 0 and 359),
  confidence text not null check (confidence in ('high', 'low')),
  computed_at timestamptz not null default now()
);

create table public.city_limit_sign_directions_refresh (
  osm_id bigint primary key,
  inside_bearing smallint not null check (inside_bearing between 0 and 359),
  confidence text not null check (confidence in ('high', 'low'))
);

alter table public.city_limit_sign_directions enable row level security;
alter table public.city_limit_sign_directions_refresh enable row level security;

create or replace function public.promote_city_limit_sign_directions_refresh(
  expected_count integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  staged_count integer;
begin
  select count(*) into staged_count from public.city_limit_sign_directions_refresh;

  if expected_count < 1 or staged_count <> expected_count then
    raise exception
      'Refusing to promote sign directions: expected %, staged %',
      expected_count,
      staged_count;
  end if;

  truncate table public.city_limit_sign_directions;

  insert into public.city_limit_sign_directions (osm_id, inside_bearing, confidence)
  select osm_id, inside_bearing, confidence
  from public.city_limit_sign_directions_refresh;
end;
$$;

create or replace function public.sign_directions_by_osm_ids(osm_ids bigint[])
returns table (osm_id bigint, inside_bearing smallint, confidence text)
language sql
stable
set search_path = ''
as $$
  select direction.osm_id, direction.inside_bearing, direction.confidence
  from public.city_limit_sign_directions as direction
  where direction.osm_id = any(osm_ids)
$$;

revoke all on function public.promote_city_limit_sign_directions_refresh(integer)
from public, anon, authenticated;
grant execute on function public.promote_city_limit_sign_directions_refresh(integer)
to service_role;

revoke all on function public.sign_directions_by_osm_ids(bigint[])
from public, anon, authenticated;
grant execute on function public.sign_directions_by_osm_ids(bigint[])
to service_role;
