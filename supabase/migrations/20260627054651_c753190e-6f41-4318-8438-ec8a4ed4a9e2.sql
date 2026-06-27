
-- Subjects & topics
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_bn text,
  name_hi text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are publicly readable" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  name_bn text,
  name_hi text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, slug)
);
GRANT SELECT ON public.topics TO anon, authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are publicly readable" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Admins manage topics" ON public.topics FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TYPE public.question_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Question bank: multi-language via jsonb {en, bn, hi}
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  target_exam public.target_exam,
  difficulty public.question_difficulty NOT NULL DEFAULT 'medium',
  question jsonb NOT NULL,            -- { en, bn, hi }
  options jsonb NOT NULL,             -- [{ en, bn, hi }, ...] length 4
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 5),
  explanation jsonb,                  -- { en, bn, hi }
  source text,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX questions_subject_idx ON public.questions(subject_id);
CREATE INDEX questions_topic_idx ON public.questions(topic_id);
CREATE INDEX questions_exam_idx ON public.questions(target_exam);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read published questions" ON public.questions FOR SELECT
  TO authenticated USING (is_published = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER questions_set_updated_at BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mock tests
CREATE TYPE public.test_type AS ENUM ('full_mock', 'sectional', 'topic', 'previous_year', 'daily');

CREATE TABLE public.mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  target_exam public.target_exam NOT NULL,
  test_type public.test_type NOT NULL DEFAULT 'full_mock',
  duration_minutes integer NOT NULL DEFAULT 60,
  total_marks numeric NOT NULL DEFAULT 0,
  negative_marks numeric NOT NULL DEFAULT 0,
  pass_marks numeric,
  is_free boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read published tests" ON public.mock_tests FOR SELECT
  TO authenticated USING (is_published = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tests" ON public.mock_tests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER mock_tests_set_updated_at BEFORE UPDATE ON public.mock_tests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Test ↔ Questions
CREATE TABLE public.mock_test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position integer NOT NULL,
  marks numeric NOT NULL DEFAULT 1,
  negative_marks numeric NOT NULL DEFAULT 0,
  UNIQUE (test_id, position),
  UNIQUE (test_id, question_id)
);
CREATE INDEX mtq_test_idx ON public.mock_test_questions(test_id);
GRANT SELECT ON public.mock_test_questions TO authenticated;
GRANT ALL ON public.mock_test_questions TO service_role;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read test questions" ON public.mock_test_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage test questions" ON public.mock_test_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Attempts
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'submitted', 'abandoned');

CREATE TABLE public.test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  status public.attempt_status NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  time_taken_seconds integer,
  score numeric NOT NULL DEFAULT 0,
  total_marks numeric NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  incorrect_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attempts_user_idx ON public.test_attempts(user_id);
CREATE INDEX attempts_test_idx ON public.test_attempts(test_id);
CREATE INDEX attempts_leaderboard_idx ON public.test_attempts(test_id, score DESC, time_taken_seconds ASC);
GRANT SELECT, INSERT, UPDATE ON public.test_attempts TO authenticated;
GRANT ALL ON public.test_attempts TO service_role;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own attempts" ON public.test_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON public.test_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts" ON public.test_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leaderboard read submitted attempts" ON public.test_attempts FOR SELECT TO authenticated
  USING (status = 'submitted');
CREATE POLICY "Admins view all attempts" ON public.test_attempts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER attempts_set_updated_at BEFORE UPDATE ON public.test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_index smallint,
  is_correct boolean,
  is_marked boolean NOT NULL DEFAULT false,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  awarded_marks numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX answers_attempt_idx ON public.attempt_answers(attempt_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage answers of own attempts" ON public.attempt_answers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));
CREATE TRIGGER answers_set_updated_at BEFORE UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed subjects
INSERT INTO public.subjects (slug, name, name_bn, name_hi, icon) VALUES
  ('quant', 'Quantitative Aptitude', 'গাণিতিক যোগ্যতা', 'मात्रात्मक योग्यता', 'Calculator'),
  ('reasoning', 'Reasoning', 'যুক্তি', 'तर्क', 'Brain'),
  ('english', 'English', 'ইংরেজি', 'अंग्रेज़ी', 'BookOpen'),
  ('gk', 'General Knowledge', 'সাধারণ জ্ঞান', 'सामान्य ज्ञान', 'Globe'),
  ('current_affairs', 'Current Affairs', 'কারেন্ট অ্যাফেয়ার্স', 'समसामयिकी', 'Newspaper');
