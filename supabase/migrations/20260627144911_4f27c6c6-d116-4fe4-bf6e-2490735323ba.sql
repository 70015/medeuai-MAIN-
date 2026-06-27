-- AI Teacher daily usage tracking
CREATE TABLE public.ai_teacher_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.ai_teacher_usage TO authenticated;
GRANT ALL ON public.ai_teacher_usage TO service_role;
ALTER TABLE public.ai_teacher_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own usage" ON public.ai_teacher_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Auto-downgrade profile.plan to 'free' when a Pro subscription period expires
CREATE OR REPLACE FUNCTION public.downgrade_expired_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET plan = 'free',
      subscription_status = 'expired'
  WHERE p.plan = 'pro'
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

-- Schedule daily downgrade check (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'parikshasathi-downgrade-expired') THEN
    PERFORM cron.unschedule('parikshasathi-downgrade-expired');
  END IF;
  PERFORM cron.schedule(
    'parikshasathi-downgrade-expired',
    '15 * * * *',  -- hourly at :15
    $cron$SELECT public.downgrade_expired_plans();$cron$
  );
END $$;