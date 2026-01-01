-- COMPREHENSIVE PICKUP REQUEST DEBUG
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if pickup_requests table exists and its structure
SELECT 
    'TABLE STRUCTURE' as section,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
ORDER BY ordinal_position;

-- 2. Check if pickup_address column exists and its constraints
SELECT 
    'PICKUP_ADDRESS COLUMN INFO' as section,
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
AND column_name = 'pickup_address';

-- 3. Check table constraints
SELECT 
    'TABLE CONSTRAINTS' as section,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'pickup_requests';

-- 4. Check current data in pickup_requests table
SELECT 
    'CURRENT DATA' as section,
    COUNT(*) as total_rows,
    COUNT(pickup_address) as rows_with_pickup_address,
    COUNT(*) - COUNT(pickup_address) as rows_with_null_pickup_address
FROM pickup_requests;

-- 5. Show sample of existing data (if any)
SELECT 
    'SAMPLE DATA' as section,
    id,
    user_id,
    area,
    street,
    house_number,
    pickup_address,
    created_at
FROM pickup_requests 
ORDER BY created_at DESC 
LIMIT 3;

-- 6. Check users table to see if location data exists
SELECT 
    'USER LOCATION DATA' as section,
    COUNT(*) as total_users,
    COUNT(area) as users_with_area,
    COUNT(street) as users_with_street,
    COUNT(house_number) as users_with_house_number
FROM users;

-- 7. Show sample user location data
SELECT 
    'SAMPLE USER DATA' as section,
    id,
    name,
    area,
    street,
    house_number,
    role
FROM users 
WHERE role = 'resident'
ORDER BY created_at DESC 
LIMIT 3;

-- Final status
SELECT 'DEBUG COMPLETE - Check results above' as final_status;