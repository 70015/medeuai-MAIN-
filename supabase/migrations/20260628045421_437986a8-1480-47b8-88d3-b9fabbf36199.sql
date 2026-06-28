
-- ============================================
-- 1. PAPER POOL: pre-generated papers per test
-- ============================================
CREATE TABLE public.paper_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  questions jsonb NOT NULL, -- [{question_id, options_order, marks, negative_marks, section_label, position}]
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'used')),
  times_served int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  first_served_at timestamptz,
  last_served_at timestamptz
);

CREATE INDEX idx_paper_pool_test_status ON public.paper_pool(test_id, status, created_at);
CREATE INDEX idx_paper_pool_test_served ON public.paper_pool(test_id, last_served_at);

GRANT SELECT ON public.paper_pool TO authenticated;
GRANT ALL ON public.paper_pool TO service_role;

ALTER TABLE public.paper_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage paper pool"
  ON public.paper_pool FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read pool metadata"
  ON public.paper_pool FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 2. PROMO CODES
-- ============================================
CREATE TYPE public.promo_grant_type AS ENUM ('pro_monthly', 'pro_yearly', 'custom', 'discount');

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  grant_type public.promo_grant_type NOT NULL,
  duration_days int, -- for custom or override
  plan_tier text, -- pro_monthly | pro_yearly (for custom)
  discount_percent int, -- 1-100 for discount type
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redemption_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);

GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo codes"
  ON public.promo_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active codes for validation"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (active = true);

CREATE TRIGGER trg_promo_codes_updated
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 3. PROMO REDEMPTIONS (track who used what)
-- ============================================
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applied_plan text NOT NULL,
  expires_at timestamptz,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id)
);

CREATE INDEX idx_promo_redemptions_user ON public.promo_redemptions(user_id);

GRANT SELECT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own redemptions"
  ON public.promo_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage redemptions"
  ON public.promo_redemptions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. CRON: hourly paper pool refill
-- ============================================
-- (We register the cron via pg_net to hit our server route.)
-- Will be added separately via project URL.
