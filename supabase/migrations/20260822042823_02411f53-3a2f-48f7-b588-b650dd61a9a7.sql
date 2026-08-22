UPDATE public.about_content SET
  website_name = 'MedEu.Ai',
  hero_title = 'About MedEu.Ai',
  tagline = 'Your Personal AI Teacher, 24/7.',
  founder_name = 'Rahamat Ali',
  seo_title = 'About MedEu.Ai',
  seo_description = 'Learn about MedEu.Ai — our mission, vision and the team behind India''s AI-powered exam prep platform.',
  seo_keywords = 'MedEu.Ai, AI teacher, exam prep, SSC, WBCS',
  business_email = 'business@medeu.ai',
  support_email = 'support@medeu.ai',
  story_paragraphs = ARRAY['MedEu.Ai was born from a simple belief: every student in India, regardless of language or background, deserves elite exam preparation. What started as a small experiment has grown into an AI-driven platform serving thousands of aspirants every day.'],
  updated_at = now()
WHERE singleton = true;