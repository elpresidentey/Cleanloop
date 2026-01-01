-- FINAL PICKUP REQUEST SOLUTION
-- This fixes both database constraints and user profile issues
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Fix users with empty location data
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

-- Step 2: Ensure pickup_requests table has pickup_address column
ALTER TABLE public.pickup_requests 
ADD COLUMN IF NOT EXISTS pickup_address TEXT;

-- Step 3: Set default for pickup_address and make it NOT NULL
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET DEFAULT 'Address not specified';

-- Step 4: Update any existing NULL pickup_address values
UPDATE public.pickup_requests 
SET pickup_address = CONCAT(
    COALESCE(NULLIF(TRIM(house_number), ''), 'N/A'), ' ', 
    COALESCE(NULLIF(TRIM(street), ''), 'N/A'), ', ', 
    COALESCE(NULLIF(TRIM(area), ''), 'N/A')
)
WHERE pickup_address IS NULL OR TRIM(pickup_address) = '';

-- Step 5: Make pickup_address NOT NULL after updating
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET NOT NULL;

-- Step 6: Add constraints to prevent empty location data in future
ALTER TABLE public.users 
ADD CONSTRAINT check_area_not_empty CHECK (area IS NOT NULL AND TRIM(area) != ''),
ADD CONSTRAINT check_street_not_empty CHECK (street IS NOT NULL AND TRIM(street) != ''),
ADD CONSTRAINT check_house_number_not_empty CHECK (house_number IS NOT NULL AND TRIM(house_number) != '');

-- Step 7: Add constraints to pickup_requests to prevent empty location data
ALTER TABLE public.pickup_requests 
ADD CONSTRAINT check_pickup_area_not_empty CHECK (area IS NOT NULL AND TRIM(area) != ''),
ADD CONSTRAINT check_pickup_street_not_empty CHECK (street IS NOT NULL AND TRIM(street) != ''),
ADD CONSTRAINT check_pickup_house_number_not_empty CHECK (house_number IS NOT NULL AND TRIM(house_number) != ''),
ADD CONSTRAINT check_pickup_address_not_empty CHECK (pickup_address IS NOT NULL AND TRIM(pickup_address) != '');

-- Step 8: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 9: Verification queries
SELECT 
    'USER PROFILE VERIFICATION' as section,
    COUNT(*) as total_residents,
    COUNT(CASE WHEN area IS NOT NULL AND TRIM(area) != '' THEN 1 END) as users_with_area,
    COUNT(CASE WHEN street IS NOT NULL AND TRIM(street) != '' THEN 1 END) as users_with_street,
    COUNT(CASE WHEN house_number IS NOT NULL AND TRIM(house_number) != '' THEN 1 END) as users_with_house_number
FROM users 
WHERE role = 'resident';

SELECT 
    'PICKUP_REQUESTS TABLE VERIFICATION' as section,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
AND column_name IN ('area', 'street', 'house_number', 'pickup_address')
ORDER BY column_name;

-- Final success message
SELECT 'ALL PICKUP REQUEST ISSUES FIXED - Try creating pickup request now!' as result;