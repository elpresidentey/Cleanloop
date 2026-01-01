-- Add missing pickup_address column to pickup_requests table
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Add the pickup_address column
ALTER TABLE public.pickup_requests 
ADD COLUMN IF NOT EXISTS pickup_address TEXT;

-- Step 2: Populate existing records with pickup_address data
UPDATE public.pickup_requests 
SET pickup_address = CONCAT(
    COALESCE(house_number, ''), ' ', 
    COALESCE(street, ''), ', ', 
    COALESCE(area, '')
)
WHERE pickup_address IS NULL OR pickup_address = '';

-- Step 3: Make pickup_address NOT NULL after populating data
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET NOT NULL;

-- Step 4: Add a default value for future inserts
ALTER TABLE public.pickup_requests 
ALTER COLUMN pickup_address SET DEFAULT 'Address not specified';

-- Step 5: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_pickup_requests_pickup_address 
ON public.pickup_requests(pickup_address);

-- Step 6: Create a trigger to automatically update pickup_address when area/street/house_number changes
CREATE OR REPLACE FUNCTION update_pickup_address()
RETURNS TRIGGER AS $$
BEGIN
  NEW.pickup_address = CONCAT(
    COALESCE(NEW.house_number, ''), ' ', 
    COALESCE(NEW.street, ''), ', ', 
    COALESCE(NEW.area, '')
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_pickup_address_trigger ON public.pickup_requests;
CREATE TRIGGER update_pickup_address_trigger
  BEFORE INSERT OR UPDATE ON public.pickup_requests
  FOR EACH ROW EXECUTE FUNCTION update_pickup_address();

-- Verification query
SELECT 
  'pickup_address column added successfully' as status,
  COUNT(*) as total_rows,
  COUNT(pickup_address) as rows_with_address
FROM pickup_requests;

-- Success message
SELECT 'PICKUP_ADDRESS COLUMN ADDED - Try creating pickup request now!' as result;