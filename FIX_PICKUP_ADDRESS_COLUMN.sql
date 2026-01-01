-- Fix pickup_address column issue
-- Run this in Supabase Dashboard → SQL Editor

-- Check if pickup_address column exists
DO $$ 
BEGIN
    -- Add pickup_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pickup_requests' 
        AND column_name = 'pickup_address'
    ) THEN
        ALTER TABLE public.pickup_requests 
        ADD COLUMN pickup_address TEXT NOT NULL DEFAULT '';
        
        -- Update existing records to have a pickup_address
        UPDATE public.pickup_requests 
        SET pickup_address = CONCAT(house_number, ' ', street, ', ', area)
        WHERE pickup_address = '' OR pickup_address IS NULL;
        
        RAISE NOTICE 'Added pickup_address column and populated existing records';
    ELSE
        RAISE NOTICE 'pickup_address column already exists';
    END IF;
END $$;

-- Verify the column structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
ORDER BY ordinal_position;

-- Test query to ensure everything works
SELECT 
    'pickup_requests table structure verified' as status,
    COUNT(*) as total_rows
FROM pickup_requests;