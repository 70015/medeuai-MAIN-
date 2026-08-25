ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS free_attempts_allowed integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS free_window_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS free_ai_daily_limit integer NOT NULL DEFAULT 10;

DROP TABLE IF EXISTS public.razorpay_plans;

SELECT cron.unschedule('parikshasathi-refill-paper-pool');

SELECT cron.schedule(
  'parikshasathi-refill-paper-pool',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--919a0eec-4904-4552-a317-8eb48c9a8544.lovable.app/api/public/hooks/refill-pool',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'medeu_pool_cron_7f3c1a9e42b84d0fa6c5e18b93d27a04'
    ),
    body := '{}'::jsonb
  );
  $$
);