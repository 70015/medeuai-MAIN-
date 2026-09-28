ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS promo_pro_ai_daily_limit integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS paid_pro_ai_daily_limit integer NOT NULL DEFAULT 20;
ALTER TABLE public.payment_settings ALTER COLUMN free_ai_daily_limit SET DEFAULT 4;
UPDATE public.payment_settings SET free_ai_daily_limit = 4 WHERE singleton = true;