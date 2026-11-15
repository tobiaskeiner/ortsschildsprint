-- Run once in the Supabase SQL editor (or through the Supabase CLI) before
-- running `pnpm --dir api refresh:city-limit-signs`.
--
-- Rows are downloaded into this staging table first. The promotion function
-- replaces the live data in a single transaction, so readers see either the
-- old complete dataset or the new complete dataset, never a partially loaded
-- table.

create table if not exists public.city_limit_signs_refresh (
  osm_id bigint primary key,
  location extensions.geography(point, 4326) not null,
  tags jsonb not null
);

create or replace function public.promote_city_limit_signs_refresh(
  expected_count integer
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  staged_count integer;
begin
  select count(*) into staged_count from public.city_limit_signs_refresh;

  if expected_count < 1 or staged_count <> expected_count then
    raise exception
      'Refusing to promote city-limit signs: expected %, staged %',
      expected_count,
      staged_count;
  end if;

  truncate table public.city_limit_signs;

  insert into public.city_limit_signs (osm_id, location, tags)
  select osm_id, location, tags
  from public.city_limit_signs_refresh;
end;
$$;

revoke all on function public.promote_city_limit_signs_refresh(integer) from public;
grant execute on function public.promote_city_limit_signs_refresh(integer) to service_role;
