
-- 1. Questions: review status, AI tracking, year
DO $$ BEGIN
  CREATE TYPE public.question_status AS ENUM ('approved', 'pending_review', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS status public.question_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS year INT,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS questions_pool_idx
  ON public.questions (target_exam, subject_id, difficulty, status);
CREATE INDEX IF NOT EXISTS questions_status_idx ON public.questions (status);
CREATE INDEX IF NOT EXISTS questions_ai_pending_idx
  ON public.questions (status, created_at DESC) WHERE status = 'pending_review';

-- 2. Mock test template config
ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS section_config JSONB,
  ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN NOT NULL DEFAULT false;

UPDATE public.mock_tests
SET is_dynamic = true,
    section_config = '{
      "total_questions": 25,
      "difficulty_distribution": {"easy": 0.4, "medium": 0.4, "hard": 0.2},
      "sections": [
        {"subject_slug": "gk", "count": 5, "label": "General Knowledge"},
        {"subject_slug": "reasoning", "count": 5, "label": "Reasoning"},
        {"subject_slug": "quant", "count": 5, "label": "Quantitative Aptitude"},
        {"subject_slug": "english", "count": 5, "label": "English"},
        {"subject_slug": "current_affairs", "count": 5, "label": "Current Affairs"}
      ]
    }'::jsonb
WHERE section_config IS NULL;

-- 3. attempt_questions
CREATE TABLE IF NOT EXISTS public.attempt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  position INT NOT NULL,
  options_order INT[] NOT NULL,
  marks NUMERIC(5,2) NOT NULL DEFAULT 1,
  negative_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
  section_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, position),
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS attempt_questions_attempt_idx ON public.attempt_questions (attempt_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempt_questions TO authenticated;
GRANT ALL ON public.attempt_questions TO service_role;
ALTER TABLE public.attempt_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own attempt questions" ON public.attempt_questions;
CREATE POLICY "Users read own attempt questions" ON public.attempt_questions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own attempt questions" ON public.attempt_questions;
CREATE POLICY "Users insert own attempt questions" ON public.attempt_questions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage attempt questions" ON public.attempt_questions;
CREATE POLICY "Admins manage attempt questions" ON public.attempt_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. user_question_history
CREATE TABLE IF NOT EXISTS public.user_question_history (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  times_seen INT NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS uqh_user_idx ON public.user_question_history (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_question_history TO authenticated;
GRANT ALL ON public.user_question_history TO service_role;
ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own history" ON public.user_question_history;
CREATE POLICY "Users manage own history" ON public.user_question_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. ai_generation_jobs
CREATE TABLE IF NOT EXISTS public.ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_exam TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  difficulty TEXT,
  count_requested INT NOT NULL,
  count_created INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ai_jobs_recent_idx ON public.ai_generation_jobs (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generation_jobs TO authenticated;
GRANT ALL ON public.ai_generation_jobs TO service_role;
ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ai jobs" ON public.ai_generation_jobs;
CREATE POLICY "Admins manage ai jobs" ON public.ai_generation_jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Restrict student question reads to approved
DROP POLICY IF EXISTS "Authenticated can read published questions" ON public.questions;
DROP POLICY IF EXISTS "Read approved questions" ON public.questions;
CREATE POLICY "Read approved questions" ON public.questions
  FOR SELECT TO authenticated
  USING ((status = 'approved' AND is_published = true) OR public.has_role(auth.uid(), 'admin'));
