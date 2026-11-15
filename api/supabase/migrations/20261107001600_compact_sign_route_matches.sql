-- The importer only needs stable OSM IDs. Keep the existing richer function
-- for compatibility and use this compact variant for activity imports.
create or replace function public.sign_ids_near_route(
  route_geojson jsonb,
  max_distance_meters double precision default 10
)
returns table (osm_id bigint)
language sql
stable
set search_path = ''
as $$
  with raw_route as (
    select extensions.st_setsrid(
      extensions.st_geomfromgeojson(route_geojson::text),
      4326
    ) as geometry
  ),
  simplified_route as (
    select extensions.st_simplify(
      extensions.st_transform(geometry, 3857),
      15
    ) as geometry
    from raw_route
  ),
  coarse_segments as (
    select extensions.st_transform(segment.geometry, 4326)::extensions.geography as geography
    from simplified_route
    cross join lateral extensions.st_subdivide(
      extensions.st_segmentize(simplified_route.geometry, 100),
      256
    ) as segment(geometry)
  ),
  candidate_signs as (
    select distinct candidate.osm_id, candidate.location
    from coarse_segments
    cross join lateral (
      select sign.osm_id, sign.location
      from public.city_limit_signs as sign
      where extensions.st_dwithin(
        sign.location,
        coarse_segments.geography,
        max_distance_meters + 20
      )
    ) as candidate
  ),
  precise_segments as (
    select extensions.st_transform(segment.geometry, 4326)::extensions.geography as geography
    from raw_route
    cross join lateral extensions.st_subdivide(
      extensions.st_segmentize(
        extensions.st_transform(raw_route.geometry, 3857),
        100
      ),
      256
    ) as segment(geometry)
  )
  select candidate_signs.osm_id
  from candidate_signs
  where exists (
    select 1
    from precise_segments
    where extensions.st_dwithin(
      candidate_signs.location,
      precise_segments.geography,
      max_distance_meters
    )
  )
$$;
