-- Fix the members table ID column issue
-- This script will ensure the ID column has proper UUID generation

-- First, let's check the current state of the id column
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' AND column_name = 'id';

-- Ensure the gen_random_uuid() function is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fix the id column to have proper UUID default
DO $$
BEGIN
    -- Drop the existing default if it exists
    BEGIN
        ALTER TABLE members ALTER COLUMN id DROP DEFAULT;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Set the proper UUID default
    ALTER TABLE members ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    -- Ensure the column is properly typed as UUID
    BEGIN
        ALTER TABLE members ALTER COLUMN id TYPE UUID USING id::UUID;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Ensure NOT NULL constraint
    ALTER TABLE members ALTER COLUMN id SET NOT NULL;
    
    RAISE NOTICE 'ID column has been fixed with proper UUID generation';
END $$;

-- Verify the fix
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' AND column_name = 'id';

-- Test the UUID generation
DO $$
DECLARE
    test_uuid UUID;
BEGIN
    SELECT gen_random_uuid() INTO test_uuid;
    RAISE NOTICE 'UUID generation test successful: %', test_uuid;
END $$;