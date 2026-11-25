DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND name LIKE ('avatars/' || auth.uid()::text || '-%')
  AND owner_id = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'uploads'
  AND name LIKE ('avatars/' || auth.uid()::text || '-%')
  AND owner_id = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'uploads'
  AND name LIKE ('avatars/' || auth.uid()::text || '-%')
  AND owner_id = auth.uid()::text
);