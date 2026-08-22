-- Payment settings (singleton)
CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  merchant_name text NOT NULL DEFAULT 'MedEu.Ai',
  upi_id text NOT NULL DEFAULT '',
  monthly_price_inr integer NOT NULL DEFAULT 99,
  yearly_price_inr integer NOT NULL DEFAULT 799,
  monthly_qr_path text,
  yearly_qr_path text,
  upi_intent_enabled boolean NOT NULL DEFAULT true,
  qr_enabled boolean NOT NULL DEFAULT true,
  instructions text NOT NULL DEFAULT 'Pay the exact amount using any UPI app, then submit the UTR / transaction ID for verification. Access is activated after manual verification.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO authenticated;
GRANT INSERT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_settings read for signed in"
  ON public.payment_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "payment_settings admin write"
  ON public.payment_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payment_settings_set_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.payment_settings (singleton) VALUES (true);

-- Payment requests
CREATE TABLE public.payment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('pro_monthly','pro_yearly')),
  amount_inr integer NOT NULL CHECK (amount_inr > 0),
  upi_id text,
  utr text NOT NULL,
  paid_on date NOT NULL,
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_requests select own"
  ON public.payment_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "payment_requests insert own pending"
  ON public.payment_requests FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

CREATE POLICY "payment_requests admin read"
  ON public.payment_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX payment_requests_one_pending_per_user
  ON public.payment_requests (user_id) WHERE status = 'pending';

CREATE INDEX payment_requests_status_created_idx
  ON public.payment_requests (status, created_at DESC);

CREATE TRIGGER payment_requests_set_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin: verify a payment request and activate/extend the subscription atomically
CREATE OR REPLACE FUNCTION public.verify_payment_request(p_request_id uuid, p_note text DEFAULT NULL)
RETURNS TABLE(out_user_id uuid, out_plan text, out_expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_req record;
  v_base timestamptz;
  v_expires timestamptz;
  v_current timestamptz;
BEGIN
  IF v_admin IS NULL OR NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_req FROM public.payment_requests WHERE id = p_request_id FOR UPDATE;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already reviewed'; END IF;

  SELECT subscription_expires_at INTO v_current FROM public.profiles WHERE id = v_req.user_id;

  v_base := GREATEST(now(), COALESCE(v_current, now()));
  v_expires := CASE WHEN v_req.plan = 'pro_yearly'
                    THEN v_base + interval '1 year'
                    ELSE v_base + interval '1 month' END;

  UPDATE public.payment_requests
  SET status = 'verified',
      reviewed_by = v_admin,
      reviewed_at = now(),
      admin_note = COALESCE(p_note, admin_note)
  WHERE id = p_request_id;

  INSERT INTO public.subscriptions (
    user_id, provider, price_id, status, current_period_start, current_period_end,
    cancel_at_period_end, environment, created_at, updated_at
  ) VALUES (
    v_req.user_id, 'upi_manual', v_req.plan, 'active', now(), v_expires,
    true, 'live', now(), now()
  );

  UPDATE public.profiles
  SET plan = v_req.plan::public.subscription_plan,
      subscription_status = 'active',
      subscription_expires_at = v_expires
  WHERE id = v_req.user_id;

  out_user_id := v_req.user_id;
  out_plan := v_req.plan;
  out_expires_at := v_expires;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_payment_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_payment_request(uuid, text) TO authenticated;

-- Admin: reject a payment request (no subscription change)
CREATE OR REPLACE FUNCTION public.reject_payment_request(p_request_id uuid, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_status text;
BEGIN
  IF v_admin IS NULL OR NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT status INTO v_status FROM public.payment_requests WHERE id = p_request_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Request already reviewed'; END IF;

  UPDATE public.payment_requests
  SET status = 'rejected',
      reviewed_by = v_admin,
      reviewed_at = now(),
      admin_note = COALESCE(p_note, admin_note)
  WHERE id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_payment_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_payment_request(uuid, text) TO authenticated;