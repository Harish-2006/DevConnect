
-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project files" ON storage.objects;

-- Create new policies with correct path handling
CREATE POLICY "Authenticated users can upload to project-files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view project-files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update project-files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete project-files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);
