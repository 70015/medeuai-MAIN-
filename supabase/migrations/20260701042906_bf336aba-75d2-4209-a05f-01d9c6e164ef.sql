
-- ============================================
-- 1) Column-level lockdown on questions
-- ============================================
REVOKE SELECT ON public.questions FROM authenticated;
REVOKE SELECT ON public.questions FROM anon;

GRANT SELECT (
  id, subject_id, topic_id, target_exam, difficulty, question, options,
  source, is_published, created_by, created_at, updated_at, status, year,
  ai_generated, reviewed_by, reviewed_at
) ON public.questions TO authenticated;

-- ============================================
-- 2) Drop broad promo_codes read policy
-- ============================================
DROP POLICY IF EXISTS "Users can view active codes for validation" ON public.promo_codes;

-- ============================================
-- 3) Server-side scoring for attempts
-- ============================================
CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS TABLE (
  out_score numeric,
  out_total_marks numeric,
  out_correct_count int,
  out_incorrect_count int,
  out_skipped_count int,
  out_accuracy numeric,
  out_time_taken_seconds int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt record;
  v_now timestamptz := now();
  v_elapsed int;
  v_correct int := 0;
  v_incorrect int := 0;
  v_skipped int := 0;
  v_score numeric := 0;
  v_attempted int;
  v_accuracy numeric;
  v_total_marks numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id, user_id, started_at, status, test_id
  INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
  IF v_attempt IS NULL THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF v_attempt.user_id <> v_user THEN RAISE EXCEPTION 'Forbidden'; END IF;

  IF v_attempt.status = 'submitted' THEN
    SELECT ta.score, mt.total_marks, ta.correct_count, ta.incorrect_count,
           ta.skipped_count, ta.accuracy, ta.time_taken_seconds
    INTO out_score, out_total_marks, out_correct_count, out_incorrect_count,
         out_skipped_count, out_accuracy, out_time_taken_seconds
    FROM public.test_attempts ta
    JOIN public.mock_tests mt ON mt.id = ta.test_id
    WHERE ta.id = p_attempt_id;
    RETURN NEXT;
    RETURN;
  END IF;

  WITH scored AS (
    SELECT
      aq.question_id,
      aq.marks,
      aq.negative_marks,
      q.correct_index,
      aa.selected_index,
      aa.is_marked,
      CASE
        WHEN aa.selected_index IS NULL THEN NULL
        WHEN aa.selected_index = q.correct_index THEN true
        ELSE false
      END AS is_correct,
      CASE
        WHEN aa.selected_index IS NULL THEN 0
        WHEN aa.selected_index = q.correct_index THEN aq.marks
        ELSE -aq.negative_marks
      END AS awarded
    FROM public.attempt_questions aq
    JOIN public.questions q ON q.id = aq.question_id
    LEFT JOIN public.attempt_answers aa
      ON aa.attempt_id = aq.attempt_id AND aa.question_id = aq.question_id
    WHERE aq.attempt_id = p_attempt_id
  ),
  upserted AS (
    INSERT INTO public.attempt_answers (
      attempt_id, question_id, selected_index, is_correct, is_marked, awarded_marks
    )
    SELECT p_attempt_id, question_id, selected_index, is_correct,
           COALESCE(is_marked, false), awarded
    FROM scored
    ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET selected_index = EXCLUDED.selected_index,
          is_correct     = EXCLUDED.is_correct,
          awarded_marks  = EXCLUDED.awarded_marks
    RETURNING is_correct, selected_index, awarded_marks
  )
  SELECT
    COALESCE(SUM(awarded_marks), 0),
    COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN is_correct = false THEN 1 ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN selected_index IS NULL THEN 1 ELSE 0 END), 0)::int
  INTO v_score, v_correct, v_incorrect, v_skipped
  FROM upserted;

  v_attempted := v_correct + v_incorrect;
  v_accuracy := CASE WHEN v_attempted = 0 THEN 0
                     ELSE ROUND((v_correct::numeric / v_attempted) * 1000) / 10 END;
  v_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_attempt.started_at))::int);

  UPDATE public.test_attempts
  SET status = 'submitted',
      submitted_at = v_now,
      time_taken_seconds = v_elapsed,
      score = v_score,
      correct_count = v_correct,
      incorrect_count = v_incorrect,
      skipped_count = v_skipped,
      accuracy = v_accuracy
  WHERE id = p_attempt_id;

  SELECT mt.total_marks INTO v_total_marks
  FROM public.mock_tests mt WHERE mt.id = v_attempt.test_id;

  out_score := v_score;
  out_total_marks := v_total_marks;
  out_correct_count := v_correct;
  out_incorrect_count := v_incorrect;
  out_skipped_count := v_skipped;
  out_accuracy := v_accuracy;
  out_time_taken_seconds := v_elapsed;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_attempt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_attempt(uuid) TO authenticated;

-- ============================================
-- 4) Return review data only for submitted attempts
-- ============================================
CREATE OR REPLACE FUNCTION public.get_attempt_review(p_attempt_id uuid)
RETURNS TABLE (
  question_id uuid,
  q_position int,
  marks numeric,
  options_order jsonb,
  section_label text,
  q_question jsonb,
  q_options jsonb,
  correct_index int,
  explanation jsonb,
  selected_index int,
  is_correct boolean,
  awarded_marks numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id, status INTO v_attempt
  FROM public.test_attempts WHERE id = p_attempt_id;
  IF v_attempt IS NULL THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF v_attempt.user_id <> v_user AND NOT public.has_role(v_user, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF v_attempt.status <> 'submitted' AND NOT public.has_role(v_user, 'admin') THEN
    RAISE EXCEPTION 'Attempt not submitted yet';
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    aq.position,
    aq.marks,
    to_jsonb(aq.options_order),
    aq.section_label,
    to_jsonb(q.question),
    to_jsonb(q.options),
    q.correct_index,
    to_jsonb(q.explanation),
    aa.selected_index,
    aa.is_correct,
    aa.awarded_marks
  FROM public.attempt_questions aq
  JOIN public.questions q ON q.id = aq.question_id
  LEFT JOIN public.attempt_answers aa
    ON aa.attempt_id = aq.attempt_id AND aa.question_id = aq.question_id
  WHERE aq.attempt_id = p_attempt_id
  ORDER BY aq.position;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_attempt_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attempt_review(uuid) TO authenticated;

-- ============================================
-- 5) Admin review queue with correct_index
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_pending_questions(p_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  target_exam text,
  difficulty text,
  q_question jsonb,
  q_options jsonb,
  correct_index int,
  explanation jsonb,
  ai_generated boolean,
  created_at timestamptz,
  subject_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT q.id, q.target_exam::text, q.difficulty::text,
         to_jsonb(q.question), to_jsonb(q.options),
         q.correct_index, to_jsonb(q.explanation), q.ai_generated,
         q.created_at, s.name
  FROM public.questions q
  LEFT JOIN public.subjects s ON s.id = q.subject_id
  WHERE q.status = 'pending_review'
  ORDER BY q.created_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_pending_questions(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pending_questions(int) TO authenticated;

-- ============================================
-- 6) Reschedule refill-pool cron with CRON_SECRET header
-- ============================================
DO $$
DECLARE v_id bigint;
BEGIN
  FOR v_id IN SELECT jobid FROM cron.job WHERE jobname = 'parikshasathi-refill-paper-pool' LOOP
    PERFORM cron.unschedule(v_id);
  END LOOP;
END $$;

SELECT cron.schedule(
  'parikshasathi-refill-paper-pool',
  '*/10 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--919a0eec-4904-4552-a317-8eb48c9a8544.lovable.app/api/public/hooks/refill-pool',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $cron$
);
