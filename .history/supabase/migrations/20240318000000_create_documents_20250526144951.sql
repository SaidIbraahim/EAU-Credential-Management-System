-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('photo', 'transcript', 'certificate', 'supporting')),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    file_url TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create index for faster lookups by registration_id
CREATE INDEX IF NOT EXISTS idx_documents_registration_id ON documents(registration_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT DO NOTHING;

-- Set up storage policies
CREATE POLICY "Documents are viewable by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Documents are insertable by authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Documents are deletable by authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Create RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents are viewable by authenticated users"
ON documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Documents are insertable by authenticated users"
ON documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Documents are deletable by authenticated users"
ON documents FOR DELETE
TO authenticated
USING (true);

-- Create function to handle document deletion
CREATE OR REPLACE FUNCTION handle_deleted_document()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the file from storage when the document record is deleted
    DELETE FROM storage.objects
    WHERE bucket_id = 'documents' AND name = OLD.file_name;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document deletion
CREATE TRIGGER on_document_deleted
    AFTER DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION handle_deleted_document(); 