-- set_updated_at is only ever invoked by BEFORE UPDATE triggers; no client needs EXECUTE.
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;

-- has_role is SECURITY DEFINER by design: RLS policies call it as the querying
-- role, so `authenticated` must keep EXECUTE. anon/PUBLIC must not.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;