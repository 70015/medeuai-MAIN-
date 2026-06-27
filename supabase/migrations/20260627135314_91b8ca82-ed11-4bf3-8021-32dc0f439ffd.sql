
-- 1. Plans cache
CREATE TABLE IF NOT EXISTS public.razorpay_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_key text NOT NULL UNIQUE,
  razorpay_plan_id text NOT NULL UNIQUE,
  period text NOT NULL,
  interval int NOT NULL DEFAULT 1,
  amount int NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  name text NOT NULL,
  environment text NOT NULL DEFAULT 'test',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.razorpay_plans TO authenticated;
GRANT SELECT ON public.razorpay_plans TO anon;
GRANT ALL ON public.razorpay_plans TO service_role;

ALTER TABLE public.razorpay_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans"
  ON public.razorpay_plans FOR SELECT
  USING (true);

CREATE TRIGGER trg_razorpay_plans_updated_at
  BEFORE UPDATE ON public.razorpay_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Extend subscriptions for Razorpay
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
  ADD COLUMN IF NOT EXISTS razorpay_customer_id text,
  ADD COLUMN IF NOT EXISTS razorpay_plan_id text,
  ADD COLUMN IF NOT EXISTS short_url text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub
  ON public.subscriptions(razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_provider
  ON public.subscriptions(user_id, provider);

-- 3. Update has_active_subscription to be provider-agnostic
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'test')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND (
        (status IN ('active', 'authenticated', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status IN ('canceled', 'cancelled') AND current_period_end > now())
      )
  );
$$;
