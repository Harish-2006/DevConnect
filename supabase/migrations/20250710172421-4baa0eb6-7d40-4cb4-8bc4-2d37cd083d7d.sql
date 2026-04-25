
-- Create RLS policies for the project-files bucket to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload project files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view project files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own project files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
