-- Migration to update user roles from 'client' to 'user' and add 'consultant'
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add new enum values (run this first)
DO $$ 
BEGIN
    -- Add 'user' role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'user';
    END IF;
    
    -- Add 'consultant' role if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consultant' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'consultant';
    END IF;
END $$;

-- Step 2: Update existing 'client' role users to 'user' role (run after step 1 is committed)
-- Note: You need to commit the transaction above before running this
UPDATE users SET role = 'user' WHERE role = 'client';

-- Step 3: Verify the migration worked
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role; 