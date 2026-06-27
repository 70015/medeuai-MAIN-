
DROP INDEX IF EXISTS public.idx_subscriptions_razorpay_sub;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_razorpay_subscription_id_key UNIQUE (razorpay_subscription_id);
