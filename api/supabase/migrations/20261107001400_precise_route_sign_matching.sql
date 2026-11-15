create or replace function public.signs_near_route(
  route_geojson jsonb,
  max_distance_meters double precision default 10
)
returns table (
  osm_id bigint,
  tags jsonb,
  lat double precision,
  long double precision
)
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
  route_segments as (
    select extensions.st_transform(segment.geometry, 4326)::extensions.geography as geography
    from simplified_route
    cross join lateral extensions.st_subdivide(
      extensions.st_segmentize(simplified_route.geometry, 100),
      256
    ) as segment(geometry)
  ),
  candidate_signs as (
    select distinct on (candidate.osm_id)
      candidate.osm_id,
      candidate.tags,
      candidate.location
    from route_segments
    cross join lateral (
      select sign.osm_id, sign.tags, sign.location
      from public.city_limit_signs as sign
      where extensions.st_dwithin(
        sign.location,
        route_segments.geography,
        max_distance_meters + 20
      )
    ) as candidate
  )
  select
    candidate_signs.osm_id,
    candidate_signs.tags,
    extensions.st_y(candidate_signs.location::extensions.geometry) as lat,
    extensions.st_x(candidate_signs.location::extensions.geometry) as long
  from candidate_signs
  cross join raw_route
  where extensions.st_dwithin(
    candidate_signs.location,
    raw_route.geometry::extensions.geography,
    max_distance_meters
  )
$$;
