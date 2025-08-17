-- Test member creation to debug the ID issue
-- Run this script to test if the ID column is working properly

-- First, let's see the current table structure
\d members;

-- Test 1: Check if gen_random_uuid() is working
SELECT gen_random_uuid() AS test_uuid;

-- Test 2: Try to insert a member manually with all required fields
INSERT INTO members (first_name, last_name, membership_status) 
VALUES ('Test', 'User', 'active')
RETURNING id, first_name, last_name, created_at;

-- Test 3: Check what we just inserted
SELECT id, first_name, last_name, membership_status, created_at 
FROM members 
WHERE first_name = 'Test' AND last_name = 'User';

-- Clean up test data
DELETE FROM members WHERE first_name = 'Test' AND last_name = 'User';

-- Test 4: Show current constraints and defaults
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;