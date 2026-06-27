CREATE OR REPLACE FUNCTION public.downgrade_expired_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET plan = 'free'::public.subscription_plan,
      subscription_status = 'expired'
  WHERE p.plan IN ('pro_monthly'::public.subscription_plan, 'pro_yearly'::public.subscription_plan)
    AND NOT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = p.id
        AND (
          (s.status IN ('active','authenticated','trialing','past_due')
            AND (s.current_period_end IS NULL OR s.current_period_end > now()))
          OR (s.status IN ('canceled','cancelled')
            AND s.current_period_end IS NOT NULL
            AND s.current_period_end > now())
        )
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.downgrade_expired_plans() FROM PUBLIC, anon, authenticated;