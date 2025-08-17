-- Diagnostic script to understand the current members table structure and constraints

-- 1. Show current table structure
SELECT 
    'COLUMN STRUCTURE' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    '' as constraint_info
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position

UNION ALL

-- 2. Show all constraints
SELECT 
    'CONSTRAINTS' as info_type,
    tc.constraint_name as column_name,
    tc.constraint_type as data_type,
    '' as is_nullable,
    '' as column_default,
    COALESCE(
        'Column: ' || kcu.column_name || 
        CASE 
            WHEN ccu.table_name IS NOT NULL 
            THEN ' -> References: ' || ccu.table_name || '(' || ccu.column_name || ')'
            ELSE ''
        END, 
        ''
    ) as constraint_info
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'members'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. Check if the members table exists at all
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'members') 
        THEN 'members table EXISTS'
        ELSE 'members table DOES NOT EXIST'
    END as table_status;

-- 4. Check if auth.users table exists (might be referenced)
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
        THEN 'auth.users table EXISTS'
        ELSE 'auth.users table DOES NOT EXIST'
    END as auth_users_status;

-- 5. Show specific foreign key details
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'members';

-- 6. Test if we can generate UUIDs
SELECT 
    'UUID Generation Test' as test_name,
    gen_random_uuid() as test_result;