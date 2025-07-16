-- Drop existing complex RLS policies
DROP POLICY IF EXISTS "Users can view business documents" ON documents;
DROP POLICY IF EXISTS "Users can insert business documents" ON documents;
DROP POLICY IF EXISTS "Users can update business documents" ON documents;
DROP POLICY IF EXISTS "Users can delete business documents" ON documents;

-- Create simplified RLS policies that work with current app structure
-- where business_id is currently set to user.id

-- Allow users to view their own documents (where business_id = user_id)
CREATE POLICY "Users can view own documents" ON documents
FOR SELECT USING (
    business_id = auth.uid()::text OR 
    business_id IN (
        SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
);

-- Allow users to insert documents for themselves or their businesses
CREATE POLICY "Users can insert own documents" ON documents
FOR INSERT WITH CHECK (
    business_id = auth.uid()::text OR 
    business_id IN (
        SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
);

-- Allow users to update their own documents
CREATE POLICY "Users can update own documents" ON documents
FOR UPDATE USING (
    business_id = auth.uid()::text OR 
    business_id IN (
        SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
FOR DELETE USING (
    business_id = auth.uid()::text OR 
    business_id IN (
        SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
);

-- Also ensure the business_id column can handle UUID or text
-- Update the documents table to use UUID for business_id for consistency
ALTER TABLE documents ALTER COLUMN business_id TYPE UUID USING business_id::UUID;

-- Recreate the policies with proper UUID handling
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Final simplified policies that work with current app structure
CREATE POLICY "Users can view own documents" ON documents
FOR SELECT USING (
    business_id = auth.uid() OR 
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own documents" ON documents
FOR INSERT WITH CHECK (
    business_id = auth.uid() OR 
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can update own documents" ON documents
FOR UPDATE USING (
    business_id = auth.uid() OR 
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own documents" ON documents
FOR DELETE USING (
    business_id = auth.uid() OR 
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
); 