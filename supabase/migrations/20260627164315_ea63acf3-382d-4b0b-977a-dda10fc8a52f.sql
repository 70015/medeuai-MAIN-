
-- About page content (single-row pattern)
CREATE TABLE public.about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  -- General
  website_name text NOT NULL DEFAULT 'ParikshaSathi AI',
  tagline text NOT NULL DEFAULT 'Prepare Smarter. Rank Faster.',
  founded_year text NOT NULL DEFAULT '2025',
  location text NOT NULL DEFAULT 'Kolkata, India',
  company_description text NOT NULL DEFAULT 'AI-powered exam preparation platform for Indian government exam aspirants.',
  -- Hero
  hero_title text NOT NULL DEFAULT 'About ParikshaSathi AI',
  hero_subtitle text NOT NULL DEFAULT 'Empowering every aspirant with AI-driven preparation.',
  mission_badge text NOT NULL DEFAULT 'Our Mission',
  vision_badge text NOT NULL DEFAULT 'Our Vision',
  short_intro text NOT NULL DEFAULT 'We are on a mission to make world-class exam preparation accessible to every student in India.',
  -- Founder
  founder_name text NOT NULL DEFAULT 'Founder Name',
  founder_position text NOT NULL DEFAULT 'Founder & CEO',
  founder_quote text NOT NULL DEFAULT 'Education is the most powerful weapon you can use to change the world.',
  founder_image_url text,
  cover_image_url text,
  logo_url text,
  -- Story
  story_title text NOT NULL DEFAULT 'Our Story',
  story_paragraphs text[] NOT NULL DEFAULT ARRAY[
    'ParikshaSathi was born from a simple belief: every student in India, regardless of language or background, deserves elite exam preparation.',
    'What started as a small experiment has grown into an AI-driven platform serving thousands of aspirants every day.'
  ]::text[],
  -- Vision
  vision_title text NOT NULL DEFAULT 'Our Vision',
  vision_description text NOT NULL DEFAULT 'To become the most trusted AI study companion for every government exam aspirant in India.',
  vision_image_url text,
  -- Mission
  mission_title text NOT NULL DEFAULT 'Our Mission',
  mission_description text NOT NULL DEFAULT 'Democratize quality exam prep with AI, in every Indian language.',
  mission_image_url text,
  -- Problem / Solution
  problem_title text NOT NULL DEFAULT 'The Problem We Solve',
  problem_list text[] NOT NULL DEFAULT ARRAY[
    'Coaching is expensive and inaccessible for many.',
    'Most resources are English-only.',
    'Students lack personalized analytics and feedback.'
  ]::text[],
  solution_list text[] NOT NULL DEFAULT ARRAY[
    'Affordable AI-powered mock tests.',
    'Content in Bengali, Hindi and English.',
    'Deep analytics and a 24/7 AI teacher.'
  ]::text[],
  -- Contact
  support_email text DEFAULT 'support@parikshasathi.app',
  business_email text DEFAULT 'business@parikshasathi.app',
  phone text,
  whatsapp text,
  address text,
  maps_link text,
  working_hours text DEFAULT 'Mon–Sat · 10am–7pm IST',
  -- Social
  social_instagram text,
  social_facebook text,
  social_linkedin text,
  social_youtube text,
  social_x text,
  social_telegram text,
  social_github text,
  social_website text,
  -- SEO
  seo_title text NOT NULL DEFAULT 'About ParikshaSathi AI',
  seo_description text NOT NULL DEFAULT 'Learn about ParikshaSathi AI — our mission, vision and the team behind India''s AI-powered exam prep platform.',
  seo_keywords text NOT NULL DEFAULT 'ParikshaSathi, exam prep, SSC, WBCS, AI tutor',
  seo_canonical text,
  seo_og_image text,
  seo_twitter_card text NOT NULL DEFAULT 'summary_large_image',
  -- Gallery
  gallery_images text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.about_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_content TO authenticated;
GRANT ALL ON public.about_content TO service_role;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "about_content public read" ON public.about_content FOR SELECT USING (true);
CREATE POLICY "about_content admin write" ON public.about_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER about_content_updated BEFORE UPDATE ON public.about_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Why-choose-us / features
CREATE TABLE public.about_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'Sparkles',
  title text NOT NULL,
  description text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_features TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_features TO authenticated;
GRANT ALL ON public.about_features TO service_role;
ALTER TABLE public.about_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "about_features public read" ON public.about_features FOR SELECT USING (true);
CREATE POLICY "about_features admin write" ON public.about_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER about_features_updated BEFORE UPDATE ON public.about_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Core values
CREATE TABLE public.about_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'Heart',
  title text NOT NULL,
  description text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_values TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_values TO authenticated;
GRANT ALL ON public.about_values TO service_role;
ALTER TABLE public.about_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "about_values public read" ON public.about_values FOR SELECT USING (true);
CREATE POLICY "about_values admin write" ON public.about_values FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER about_values_updated BEFORE UPDATE ON public.about_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Roadmap
CREATE TABLE public.about_roadmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed','in_progress','upcoming')),
  display_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_roadmap TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_roadmap TO authenticated;
GRANT ALL ON public.about_roadmap TO service_role;
ALTER TABLE public.about_roadmap ENABLE ROW LEVEL SECURITY;
CREATE POLICY "about_roadmap public read" ON public.about_roadmap FOR SELECT USING (true);
CREATE POLICY "about_roadmap admin write" ON public.about_roadmap FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER about_roadmap_updated BEFORE UPDATE ON public.about_roadmap
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FAQ
CREATE TABLE public.about_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_faqs TO authenticated;
GRANT ALL ON public.about_faqs TO service_role;
ALTER TABLE public.about_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "about_faqs public read" ON public.about_faqs FOR SELECT USING (true);
CREATE POLICY "about_faqs admin write" ON public.about_faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER about_faqs_updated BEFORE UPDATE ON public.about_faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed singleton row + sample list items
INSERT INTO public.about_content (singleton) VALUES (true) ON CONFLICT DO NOTHING;

INSERT INTO public.about_features (icon, title, description, display_order) VALUES
  ('Brain','AI Teacher','24/7 AI tutor that explains every wrong answer in your language.',1),
  ('Zap','Adaptive Mock Tests','Mocks that adapt to your weak areas in real time.',2),
  ('Languages','Trilingual Content','Every question in Bengali, Hindi and English.',3),
  ('LineChart','Deep Analytics','Topic-level accuracy, time analysis and AI revision plans.',4);

INSERT INTO public.about_values (icon, title, description, display_order) VALUES
  ('Heart','Student First','Every decision starts with what is best for the student.',1),
  ('ShieldCheck','Integrity','Honest pricing, honest content, honest results.',2),
  ('Sparkles','Excellence','We obsess over the small details that compound into great prep.',3);

INSERT INTO public.about_roadmap (date_label, title, description, status, display_order) VALUES
  ('Q1 2025','Public Launch','ParikshaSathi opens to all aspirants across India.','completed',1),
  ('Q2 2025','AI Teacher v2','Deeper concept explanations and similar-question generation.','completed',2),
  ('Q3 2026','Regional Languages','Tamil, Telugu, Marathi and Gujarati support.','in_progress',3),
  ('Q4 2026','Mobile App','Native Android and iOS apps with offline mode.','upcoming',4);

INSERT INTO public.about_faqs (question, answer, display_order) VALUES
  ('Is ParikshaSathi free to use?','Yes — every new user gets 3 free mock tests every month. Paid plans unlock unlimited tests and the AI Teacher.',1),
  ('Which exams are supported?','SSC CGL, SSC CHSL, WBCS, WBPSC, Railway, Banking, Police and more.',2),
  ('In which languages is content available?','Bengali, Hindi and English — across questions, explanations and the AI Teacher.',3);
