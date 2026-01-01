-- IMMEDIATE FIX for pickup_address column issue
-- Run this in Supabase Dashboard → SQL Editor → Click RUN

-- Step 1: Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
ORDER BY ordinal_position;

-- Step 2: Make pickup_address column nullable (temporary fix)
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address DROP NOT NULL;

-- Step 3: Add a default value for pickup_address
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET DEFAULT 'Address not specified';

-- Step 4: Update any existing NULL values
UPDATE public.pickup_requests 
SET pickup_address = CONCAT(
    COALESCE(house_number, ''), ' ', 
    COALESCE(street, ''), ', ', 
    COALESCE(area, '')
)
WHERE pickup_address IS NULL OR pickup_address = '';

-- Step 5: Verify the fix
SELECT 
    'pickup_address column fixed' as status,
    COUNT(*) as total_rows,
    COUNT(pickup_address) as rows_with_address
FROM pickup_requests;

-- Success message
SELECT 'IMMEDIATE FIX APPLIED - Try creating pickup request now!' as result;