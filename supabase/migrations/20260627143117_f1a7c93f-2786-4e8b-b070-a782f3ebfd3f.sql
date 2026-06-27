
-- Per-exam syllabus + pattern, drives AI generation grounding
CREATE TABLE public.exam_syllabi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_exam target_exam NOT NULL UNIQUE,
  name text NOT NULL,
  syllabus text NOT NULL,
  pattern jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exam_syllabi TO authenticated;
GRANT ALL ON public.exam_syllabi TO service_role;

ALTER TABLE public.exam_syllabi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads active syllabi" ON public.exam_syllabi
  FOR SELECT TO authenticated USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage syllabi" ON public.exam_syllabi
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER exam_syllabi_set_updated_at
  BEFORE UPDATE ON public.exam_syllabi
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed SSC CHSL, SSC CGL, WBCS
INSERT INTO public.exam_syllabi (target_exam, name, syllabus, pattern) VALUES
('ssc_chsl', 'SSC CHSL Tier-I',
$$Tier-I CBT consists of four sections: English Language, General Intelligence (Reasoning), Quantitative Aptitude (Basic Arithmetic Skill), and General Awareness.
- English: Spot the error, fill in the blanks, synonyms/antonyms, spelling, idioms & phrases, one-word substitution, improvement of sentences, active/passive, direct/indirect, shuffling of sentence parts, cloze passage, comprehension.
- Reasoning: Verbal & non-verbal — analogies, classification, series, coding-decoding, blood relations, direction, syllogism, Venn diagrams, paper folding, mirror images, embedded figures.
- Quantitative: Number systems, percentage, ratio & proportion, averages, profit & loss, discount, simple & compound interest, time & work, time-speed-distance, mensuration, algebra, geometry, trigonometry, data interpretation.
- General Awareness: Current affairs (India & world, last 12 months), static GK — history, geography, polity, economy, science, sports, awards, books & authors.$$,
'{"total_questions":100,"duration_minutes":60,"marks_per_question":2,"negative_marks":0.5,"difficulty_distribution":{"easy":0.4,"medium":0.4,"hard":0.2},"sections":[
  {"subject_slug":"english","label":"English Language","count":25},
  {"subject_slug":"reasoning","label":"General Intelligence","count":25},
  {"subject_slug":"quant","label":"Quantitative Aptitude","count":25},
  {"subject_slug":"gk","label":"General Awareness","count":25}
]}'::jsonb),

('ssc_cgl', 'SSC CGL Tier-I',
$$Tier-I has four sections of 25 questions each: General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, and English Comprehension.
- Reasoning: Analogies, similarities & differences, space visualization, problem-solving, analysis, judgement, decision making, visual memory, discrimination, observation, relationship concepts, arithmetical reasoning, verbal & figure classification, number series, non-verbal series, coding & decoding, statement conclusion.
- General Awareness: India and neighbours — history, culture, geography, economic scene, general polity, Indian Constitution, scientific research, current affairs.
- Quantitative: Whole numbers, decimals, fractions, percentage, ratio, square roots, averages, interest, profit/loss, discount, partnership, mixture, time/distance, time/work, algebra, geometry, mensuration, trigonometry, statistical charts.
- English: Reading comprehension, sentence structure, synonyms/antonyms, vocabulary, spellings, grammar usage.$$,
'{"total_questions":100,"duration_minutes":60,"marks_per_question":2,"negative_marks":0.5,"difficulty_distribution":{"easy":0.3,"medium":0.5,"hard":0.2},"sections":[
  {"subject_slug":"reasoning","label":"Reasoning","count":25},
  {"subject_slug":"gk","label":"General Awareness","count":25},
  {"subject_slug":"quant","label":"Quantitative Aptitude","count":25},
  {"subject_slug":"english","label":"English","count":25}
]}'::jsonb),

('wbcs', 'WBCS Preliminary',
$$WBCS Prelims is a single paper of 200 marks covering eight broad topics.
- English Composition: synonyms/antonyms, idioms, phrases, vocabulary.
- General Science: Physics, Chemistry, Biology, everyday observation and experience.
- Current Events of National & International importance.
- History of India with special reference to the National Movement.
- Geography of India with special reference to West Bengal.
- Indian Polity & Economy.
- Indian National Movement.
- General Mental Ability: logical reasoning, analytical ability, basic numeracy.$$,
'{"total_questions":200,"duration_minutes":150,"marks_per_question":1,"negative_marks":0.33,"difficulty_distribution":{"easy":0.3,"medium":0.5,"hard":0.2},"sections":[
  {"subject_slug":"english","label":"English","count":25},
  {"subject_slug":"gk","label":"General Studies","count":125},
  {"subject_slug":"reasoning","label":"Mental Ability","count":25},
  {"subject_slug":"quant","label":"Arithmetic","count":25}
]}'::jsonb);
