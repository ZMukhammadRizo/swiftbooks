-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    category TEXT DEFAULT 'Other',
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_business_id ON documents(business_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own documents" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents from their business
CREATE POLICY "Users can view business documents" ON documents
FOR SELECT USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
        UNION
        SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
);

-- Users can insert documents for their business
CREATE POLICY "Users can insert business documents" ON documents
FOR INSERT WITH CHECK (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
        UNION
        SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
);

-- Users can update documents for their business
CREATE POLICY "Users can update business documents" ON documents
FOR UPDATE USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
        UNION
        SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
);

-- Users can delete documents for their business
CREATE POLICY "Users can delete business documents" ON documents
FOR DELETE USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
        UNION
        SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 