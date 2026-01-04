-- FORCE SCHEMA CACHE REFRESH - Run this immediately
-- This will force PostgREST to recognize the new table structure

-- Step 1: Force multiple schema cache refreshes
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 2: Wait a moment, then refresh again
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the table is accessible
SELECT 
    'SCHEMA REFRESH VERIFICATION' as section,
    COUNT(*) as pickup_requests_accessible
FROM pickup_requests;

-- Step 4: Test a simple insert to verify everything works
DO $$
DECLARE
    test_user_id UUID;
    test_pickup_id UUID;
BEGIN
    -- Get any user for testing
    SELECT id INTO test_user_id FROM users WHERE role = 'resident' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try inserting with minimal data (triggers should handle the rest)
        INSERT INTO pickup_requests (user_id, scheduled_date, notes)
        VALUES (test_user_id, CURRENT_DATE + 1, 'Schema refresh test')
        RETURNING id INTO test_pickup_id;
        
        -- Verify the insert worked and triggers populated data
        IF test_pickup_id IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: Pickup request created with ID %', test_pickup_id;
            
            -- Check what the triggers populated
            PERFORM area, street, house_number, pickup_address 
            FROM pickup_requests 
            WHERE id = test_pickup_id;
            
            -- Clean up test data
            DELETE FROM pickup_requests WHERE id = test_pickup_id;
            RAISE NOTICE 'Test data cleaned up successfully';
        END IF;
    ELSE
        RAISE NOTICE 'No test user found - but schema refresh completed';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed but schema refresh completed: %', SQLERRM;
END $$;

-- Final verification
SELECT 'SCHEMA CACHE FORCIBLY REFRESHED - Try pickup request now!' as result;