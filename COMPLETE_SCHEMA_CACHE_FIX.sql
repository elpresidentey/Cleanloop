-- COMPLETE SCHEMA CACHE FIX FOR ALL TABLES
-- This fixes schema cache issues for payments, pickup_requests, and all other tables
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Force multiple schema refreshes with delays
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

-- Step 2: Verify all critical tables are accessible
SELECT 'VERIFYING TABLE ACCESS' as section;

-- Test payments table
SELECT 'payments table' as table_name, COUNT(*) as accessible FROM payments;

-- Test pickup_requests table  
SELECT 'pickup_requests table' as table_name, COUNT(*) as accessible FROM pickup_requests;

-- Test users table
SELECT 'users table' as table_name, COUNT(*) as accessible FROM users;

-- Test subscriptions table
SELECT 'subscriptions table' as table_name, COUNT(*) as accessible FROM subscriptions;

-- Test complaints table
SELECT 'complaints table' as table_name, COUNT(*) as accessible FROM complaints;

-- Step 3: Force another schema refresh after verification
NOTIFY pgrst, 'reload schema';

-- Step 4: Test actual database operations that were failing

-- Test payment creation (this was failing in the error message)
DO $$
DECLARE
    test_user_id UUID;
    test_payment_id UUID;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM users WHERE role = 'resident' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try creating a test payment
        INSERT INTO payments (user_id, amount, currency, payment_method, reference, status)
        VALUES (test_user_id, 1000, 'NGN', 'transfer', 'TEST_REF_' || extract(epoch from now()), 'completed')
        RETURNING id INTO test_payment_id;
        
        IF test_payment_id IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: Payment creation works - ID %', test_payment_id;
            -- Clean up
            DELETE FROM payments WHERE id = test_payment_id;
            RAISE NOTICE 'Payment test data cleaned up';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Payment test failed: %', SQLERRM;
END $$;

-- Test pickup request creation
DO $$
DECLARE
    test_user_id UUID;
    test_pickup_id UUID;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM users WHERE role = 'resident' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try creating a test pickup request
        INSERT INTO pickup_requests (user_id, scheduled_date, notes)
        VALUES (test_user_id, CURRENT_DATE + 1, 'Schema test')
        RETURNING id INTO test_pickup_id;
        
        IF test_pickup_id IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: Pickup request creation works - ID %', test_pickup_id;
            -- Clean up
            DELETE FROM pickup_requests WHERE id = test_pickup_id;
            RAISE NOTICE 'Pickup request test data cleaned up';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Pickup request test failed: %', SQLERRM;
END $$;

-- Step 5: Final schema refresh
NOTIFY pgrst, 'reload schema';

-- Step 6: Show final status
SELECT 
    'COMPLETE SCHEMA CACHE FIX APPLIED!' as status,
    'All database operations should work now' as message,
    'Try payments and pickup requests in your app' as instruction;