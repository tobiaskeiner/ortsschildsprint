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
  with route as (
    select extensions.st_simplify(
      extensions.st_transform(
        extensions.st_setsrid(
          extensions.st_geomfromgeojson(route_geojson::text),
          4326
        ),
        3857
      ),
      2
    ) as geometry
  ),
  route_segments as (
    select extensions.st_transform(segment.geometry, 4326)::extensions.geography as geography
    from route
    cross join lateral extensions.st_subdivide(
      extensions.st_segmentize(route.geometry, 100),
      256
    ) as segment(geometry)
  )
  select distinct on (sign.osm_id)
    sign.osm_id,
    sign.tags,
    extensions.st_y(sign.location::extensions.geometry) as lat,
    extensions.st_x(sign.location::extensions.geometry) as long
  from route_segments
  cross join lateral (
    select candidate.osm_id, candidate.tags, candidate.location
    from public.city_limit_signs as candidate
    where extensions.st_dwithin(
      candidate.location,
      route_segments.geography,
      max_distance_meters
    )
  ) as sign
  order by sign.osm_id
$$;
