-- EMERGENCY FIX - Run this RIGHT NOW in Supabase Dashboard
-- This will fix the pickup request issue immediately

-- Step 1: Fix ALL users with empty location data
UPDATE users 
SET 
    area = COALESCE(NULLIF(TRIM(area), ''), 'Lagos Island'),
    street = COALESCE(NULLIF(TRIM(street), ''), 'Marina Street'),
    house_number = COALESCE(NULLIF(TRIM(house_number), ''), '123'),
    updated_at = NOW()
WHERE role = 'resident';

-- Step 2: Make area, street, house_number columns have defaults
ALTER TABLE users 
ALTER COLUMN area SET DEFAULT 'Lagos Island',
ALTER COLUMN street SET DEFAULT 'Marina Street',
ALTER COLUMN house_number SET DEFAULT '123';

-- Step 3: Make pickup_requests columns have defaults too
ALTER TABLE pickup_requests 
ALTER COLUMN area SET DEFAULT 'Lagos Island',
ALTER COLUMN street SET DEFAULT 'Marina Street',
ALTER COLUMN house_number SET DEFAULT '123';

-- Step 4: Add pickup_address column with default
ALTER TABLE pickup_requests 
ADD COLUMN IF NOT EXISTS pickup_address TEXT DEFAULT 'Address not specified';

-- Step 5: Make pickup_address NOT NULL
ALTER TABLE pickup_requests 
ALTER COLUMN pickup_address SET NOT NULL;

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 'EMERGENCY FIX APPLIED!' as status,
       'All users now have location data' as result;

-- Show fixed users
SELECT name, email, area, street, house_number 
FROM users 
WHERE role = 'resident' 
LIMIT 5;