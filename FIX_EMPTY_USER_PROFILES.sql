-- Fix users with empty location data
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Check users with empty location data
SELECT 
    'USERS WITH EMPTY LOCATION DATA' as section,
    id, 
    name, 
    email,
    area,
    street,
    house_number
FROM users 
WHERE role = 'resident' 
AND (area IS NULL OR area = '' OR street IS NULL OR street = '' OR house_number IS NULL OR house_number = '');

-- Step 2: Update users with empty location data
UPDATE users 
SET 
    area = CASE 
        WHEN area IS NULL OR area = '' THEN 'Lagos Island'
        ELSE area 
    END,
    street = CASE 
        WHEN street IS NULL OR street = '' THEN 'Marina Street'
        ELSE street 
    END,
    house_number = CASE 
        WHEN house_number IS NULL OR house_number = '' THEN '123'
        ELSE house_number 
    END,
    updated_at = NOW()
WHERE role = 'resident' 
AND (area IS NULL OR area = '' OR street IS NULL OR street = '' OR house_number IS NULL OR house_number = '');

-- Step 3: Verify the fix
SELECT 
    'AFTER FIX - ALL USERS SHOULD HAVE LOCATION DATA' as section,
    COUNT(*) as total_residents,
    COUNT(CASE WHEN area IS NOT NULL AND area != '' THEN 1 END) as users_with_area,
    COUNT(CASE WHEN street IS NOT NULL AND street != '' THEN 1 END) as users_with_street,
    COUNT(CASE WHEN house_number IS NOT NULL AND house_number != '' THEN 1 END) as users_with_house_number
FROM users 
WHERE role = 'resident';

-- Step 4: Show users that were updated
SELECT 
    'UPDATED USERS' as section,
    id,
    name,
    email,
    area,
    street,
    house_number
FROM users 
WHERE role = 'resident'
AND updated_at > NOW() - INTERVAL '1 minute';

SELECT 'USER PROFILES FIXED - Try pickup request now!' as result;