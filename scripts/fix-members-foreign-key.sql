-- Fix foreign key constraint issue on members table
-- This script will remove any unwanted foreign key constraints on the members.id column

-- First, let's see what constraints exist on the members table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'members' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- Drop the problematic foreign key constraint on members.id if it exists
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint on members.id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'members' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'id';
    
    -- If a foreign key constraint exists on the id column, drop it
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE members DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found on members.id column';
    END IF;
END $$;

-- Ensure the members table structure is correct
-- The id should be a primary key, not a foreign key
DO $$
BEGIN
    -- Make sure id is the primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'members' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name LIKE '%pkey%'
    ) THEN
        -- Drop any existing primary key first
        BEGIN
            ALTER TABLE members DROP CONSTRAINT IF EXISTS members_pkey;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
        
        -- Add primary key constraint
        ALTER TABLE members ADD CONSTRAINT members_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key constraint on members.id';
    END IF;
    
    -- Ensure proper UUID default
    ALTER TABLE members ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    -- Ensure NOT NULL constraint
    ALTER TABLE members ALTER COLUMN id SET NOT NULL;
    
    RAISE NOTICE 'Members table id column has been fixed';
END $$;

-- Create a clean members table if the current one is too problematic
-- UNCOMMENT THE SECTION BELOW ONLY IF YOU WANT TO RECREATE THE TABLE
-- WARNING: This will delete all existing member data!

/*
-- Backup existing data first
CREATE TABLE IF NOT EXISTS members_backup AS SELECT * FROM members;

-- Drop and recreate the members table
DROP TABLE IF EXISTS members CASCADE;

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    membership_status TEXT NOT NULL CHECK (membership_status IN ('active', 'inactive', 'frozen', 'cancelled')) DEFAULT 'active',
    emergency_contact JSONB,
    medical_conditions TEXT,
    fitness_goals TEXT,
    preferred_training_times TEXT[],
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Admin and trainers manage members" ON members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
*/

-- Show the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;

-- Show remaining constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'members';

-- Test UUID generation
SELECT gen_random_uuid() AS test_uuid_generation;