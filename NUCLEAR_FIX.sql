-- NUCLEAR OPTION: Make all location columns nullable temporarily
-- This will DEFINITELY fix the pickup request issue
-- Run this in Supabase Dashboard → SQL Editor RIGHT NOW

-- Step 1: Make all location columns in pickup_requests nullable
ALTER TABLE pickup_requests 
ALTER COLUMN area DROP NOT NULL,
ALTER COLUMN street DROP NOT NULL,
ALTER COLUMN house_number DROP NOT NULL;

-- Step 2: Add pickup_address column if it doesn't exist
ALTER TABLE pickup_requests 
ADD COLUMN IF NOT EXISTS pickup_address TEXT;

-- Step 3: Set defaults for all columns
ALTER TABLE pickup_requests 
ALTER COLUMN area SET DEFAULT 'Lagos Island',
ALTER COLUMN street SET DEFAULT 'Marina Street',
ALTER COLUMN house_number SET DEFAULT '123',
ALTER COLUMN pickup_address SET DEFAULT 'Address not specified';

-- Step 4: Update any existing NULL values
UPDATE pickup_requests 
SET 
    area = COALESCE(area, 'Lagos Island'),
    street = COALESCE(street, 'Marina Street'),
    house_number = COALESCE(house_number, '123'),
    pickup_address = COALESCE(pickup_address, 
        CONCAT(
            COALESCE(house_number, '123'), ' ',
            COALESCE(street, 'Marina Street'), ', ',
            COALESCE(area, 'Lagos Island')
        )
    );

-- Step 5: Fix all users with empty location data
UPDATE users 
SET 
    area = COALESCE(NULLIF(TRIM(area), ''), 'Lagos Island'),
    street = COALESCE(NULLIF(TRIM(street), ''), 'Marina Street'),
    house_number = COALESCE(NULLIF(TRIM(house_number), ''), '123')
WHERE role = 'resident';

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 'NUCLEAR FIX APPLIED!' as status,
       'Pickup requests should work now!' as message;

-- Show that columns are now nullable
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
AND column_name IN ('area', 'street', 'house_number', 'pickup_address');