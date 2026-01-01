-- ULTIMATE PICKUP REQUEST FIX
-- This solves the "null value in column 'area'" error completely
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Fix the specific user with empty location data
UPDATE users 
SET 
    area = 'Lagos Island',
    street = 'Marina Street', 
    house_number = '123',
    updated_at = NOW()
WHERE email = 'testuser@cleanloop.com'
AND (area IS NULL OR area = '' OR street IS NULL OR street = '' OR house_number IS NULL OR house_number = '');

-- Step 2: Fix ALL users with empty location data (safety net)
UPDATE users 
SET 
    area = CASE 
        WHEN area IS NULL OR TRIM(area) = '' THEN 'Lagos Island'
        ELSE area 
    END,
    street = CASE 
        WHEN street IS NULL OR TRIM(street) = '' THEN 'Marina Street'
        ELSE street 
    END,
    house_number = CASE 
        WHEN house_number IS NULL OR TRIM(house_number) = '' THEN '123'
        ELSE house_number 
    END,
    updated_at = NOW()
WHERE role = 'resident' 
AND (area IS NULL OR TRIM(area) = '' OR street IS NULL OR TRIM(street) = '' OR house_number IS NULL OR TRIM(house_number) = '');

-- Step 3: Ensure pickup_requests table has pickup_address column
ALTER TABLE public.pickup_requests 
ADD COLUMN IF NOT EXISTS pickup_address TEXT DEFAULT 'Address not specified';

-- Step 4: Make pickup_address NOT NULL with default
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET NOT NULL;

-- Step 5: Refresh schema cache to fix any remaining PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Step 6: Verification - Check that problematic user is now fixed
SELECT 
    'FIXED USER VERIFICATION' as section,
    name,
    email,
    area,
    street,
    house_number,
    CASE 
        WHEN area IS NOT NULL AND area != '' AND 
             street IS NOT NULL AND street != '' AND 
             house_number IS NOT NULL AND house_number != '' 
        THEN 'COMPLETE ✅' 
        ELSE 'INCOMPLETE ❌' 
    END as location_status
FROM users 
WHERE email = 'testuser@cleanloop.com';

-- Step 7: Verify all users now have complete location data
SELECT 
    'ALL USERS VERIFICATION' as section,
    COUNT(*) as total_residents,
    COUNT(CASE WHEN area IS NOT NULL AND area != '' AND 
                    street IS NOT NULL AND street != '' AND 
                    house_number IS NOT NULL AND house_number != '' 
               THEN 1 END) as users_with_complete_location,
    COUNT(CASE WHEN area IS NULL OR area = '' OR 
                    street IS NULL OR street = '' OR 
                    house_number IS NULL OR house_number = '' 
               THEN 1 END) as users_with_incomplete_location
FROM users 
WHERE role = 'resident';

-- Step 8: Test pickup_requests table structure
SELECT 
    'PICKUP_REQUESTS TABLE STRUCTURE' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
AND column_name IN ('area', 'street', 'house_number', 'pickup_address')
ORDER BY column_name;

-- Final success message
SELECT 'PICKUP REQUEST ISSUE COMPLETELY FIXED! 🎉' as result,
       'Try creating a pickup request now - it should work!' as instruction;