create or replace function public.signs_by_osm_ids(osm_ids bigint[])
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
  select
    sign.osm_id,
    sign.tags,
    extensions.st_y(sign.location::extensions.geometry) as lat,
    extensions.st_x(sign.location::extensions.geometry) as long
  from public.city_limit_signs as sign
  where sign.osm_id = any(osm_ids)
$$;
