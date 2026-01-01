-- Refresh Supabase Schema Cache
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- 2. Verify all tables exist
SELECT 
    schemaname, 
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 3. Check pickup_requests table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
ORDER BY ordinal_position;

-- 4. Check payments table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- 5. Check users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 6. Test a simple query on each table
SELECT 'pickup_requests' as table_name, COUNT(*) as row_count FROM pickup_requests
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as row_count FROM payments  
UNION ALL
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'subscriptions' as table_name, COUNT(*) as row_count FROM subscriptions
UNION ALL
SELECT 'complaints' as table_name, COUNT(*) as row_count FROM complaints;

-- Success message
SELECT 'Schema cache refreshed successfully! All tables are accessible.' as status;