
-- 1) Replace broad leaderboard SELECT policy with a SECURITY DEFINER RPC that
--    only returns minimal aggregated fields.
DROP POLICY IF EXISTS "Leaderboard read submitted attempts" ON public.test_attempts;

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_test_id uuid, p_limit int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  score numeric,
  time_taken_seconds integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (ta.user_id)
    ta.user_id,
    p.full_name,
    p.avatar_url,
    ta.score,
    ta.time_taken_seconds
  FROM public.test_attempts ta
  LEFT JOIN public.profiles p ON p.id = ta.user_id
  WHERE ta.test_id = p_test_id
    AND ta.status = 'submitted'
  ORDER BY ta.user_id, ta.score DESC NULLS LAST, ta.time_taken_seconds ASC NULLS LAST
  LIMIT GREATEST(p_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(uuid, int) TO authenticated;

-- 2) Lock down SECURITY DEFINER functions that signed-in users should never
--    invoke directly. Trigger and cron entry points only.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.downgrade_expired_plans() FROM PUBLIC, anon, authenticated;

-- has_role / has_active_subscription are used inside RLS policy quals, so
-- authenticated still needs EXECUTE. Strip access from anon and PUBLIC.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
