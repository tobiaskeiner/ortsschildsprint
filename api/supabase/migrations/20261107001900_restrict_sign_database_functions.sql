-- These functions are implementation details of the Worker. Prevent direct
-- PostgREST callers from using the expensive spatial queries.
revoke all on function public.signs_in_box(double precision, double precision, double precision, double precision)
from public, anon, authenticated;
revoke all on function public.signs_near_route(jsonb, double precision)
from public, anon, authenticated;
revoke all on function public.sign_ids_near_route(jsonb, double precision)
from public, anon, authenticated;
revoke all on function public.signs_by_osm_ids(bigint[])
from public, anon, authenticated;

grant execute on function public.signs_in_box(double precision, double precision, double precision, double precision)
to service_role;
grant execute on function public.signs_near_route(jsonb, double precision)
to service_role;
grant execute on function public.sign_ids_near_route(jsonb, double precision)
to service_role;
grant execute on function public.signs_by_osm_ids(bigint[])
to service_role;
