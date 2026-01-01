-- SIMPLE PICKUP ADDRESS FIX
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Add pickup_address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pickup_requests' 
        AND column_name = 'pickup_address'
    ) THEN
        ALTER TABLE public.pickup_requests 
        ADD COLUMN pickup_address TEXT;
    END IF;
END $$;

-- Step 2: Set default value and make it NOT NULL
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET DEFAULT 'Address not specified';

-- Step 3: Update any existing NULL values
UPDATE public.pickup_requests 
SET pickup_address = CONCAT(
    COALESCE(house_number, ''), ' ', 
    COALESCE(street, ''), ', ', 
    COALESCE(area, '')
)
WHERE pickup_address IS NULL OR pickup_address = '';

-- Step 4: Make it NOT NULL after updating
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET NOT NULL;

-- Step 5: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the fix
SELECT 
    'PICKUP_ADDRESS COLUMN FIXED' as status,
    COUNT(*) as total_rows,
    COUNT(pickup_address) as rows_with_address
FROM pickup_requests;

SELECT 'SUCCESS - Try creating pickup request now!' as result;