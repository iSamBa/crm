-- Check current table structures
-- Run this script to see what tables and columns you currently have

-- Check if members table exists and show its structure
SELECT 
    'members' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;

-- Check if membership_plans table exists
SELECT 
    'membership_plans' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'membership_plans' 
ORDER BY ordinal_position;

-- Check if subscriptions table exists
SELECT 
    'subscriptions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
ORDER BY ordinal_position;

-- Show existing constraints on members table
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'members';

-- Count existing records
SELECT 
    (SELECT COUNT(*) FROM members) as member_count,
    (SELECT COUNT(*) FROM membership_plans) as plan_count,
    (SELECT COUNT(*) FROM subscriptions) as subscription_count;