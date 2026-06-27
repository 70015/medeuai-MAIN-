
CREATE POLICY "about_media public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'about-media');

CREATE POLICY "about_media admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'about-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "about_media admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'about-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "about_media admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'about-media' AND public.has_role(auth.uid(), 'admin'));
