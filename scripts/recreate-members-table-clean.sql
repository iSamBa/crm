-- Clean recreation of members table without any foreign key constraints
-- WARNING: This will delete all existing member data!
-- Run the diagnostic script first to backup your data if needed

-- 1. Backup existing data (uncomment if you have important data)
-- CREATE TABLE members_backup AS SELECT * FROM members;

-- 2. Drop the problematic table and recreate it cleanly
DROP TABLE IF EXISTS members CASCADE;

-- 3. Create the members table with correct structure
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

-- 4. Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy for admin and trainer access
CREATE POLICY "Admin and trainers manage members" ON members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    );

-- 6. Create updated_at trigger
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

-- 7. Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 8. Test the table by inserting and deleting a test record
INSERT INTO members (first_name, last_name, membership_status) 
VALUES ('Test', 'User', 'active')
RETURNING id, first_name, last_name, created_at;

-- Clean up test record
DELETE FROM members WHERE first_name = 'Test' AND last_name = 'User';

-- 9. Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;

-- 10. Show constraints (should only be PRIMARY KEY and CHECK constraints)
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'members';

-- 11. Success message
DO $$
BEGIN
    RAISE NOTICE 'Members table has been recreated successfully!';
    RAISE NOTICE 'The table is now ready for use without foreign key constraints.';
    RAISE NOTICE 'You can now create members through the dashboard.';
END $$;