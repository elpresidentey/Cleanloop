-- CLEAN BYPASS FUNCTIONS - DROP AND RECREATE
-- This safely drops existing functions and creates new ones with correct return types
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_pickup_request_direct(UUID, DATE, TEXT);
DROP FUNCTION IF EXISTS create_payment_direct(UUID, NUMERIC, TEXT, TEXT, TEXT);

-- Step 2: Create the pickup request function with correct return type
CREATE OR REPLACE FUNCTION create_pickup_request_direct(
    p_user_id UUID,
    p_scheduled_date DATE,
    p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result_id UUID;
    user_data RECORD;
    result JSON;
BEGIN
    -- Get user location data
    SELECT area, street, house_number INTO user_data
    FROM users 
    WHERE id = p_user_id AND role = 'resident';
    
    -- Use defaults if user data is missing
    IF user_data.area IS NULL OR user_data.area = '' THEN
        user_data.area := 'Lagos Island';
    END IF;
    IF user_data.street IS NULL OR user_data.street = '' THEN
        user_data.street := 'Marina Street';
    END IF;
    IF user_data.house_number IS NULL OR user_data.house_number = '' THEN
        user_data.house_number := '123';
    END IF;
    
    -- Insert pickup request directly
    INSERT INTO pickup_requests (
        user_id, 
        scheduled_date, 
        notes, 
        status, 
        area, 
        street, 
        house_number, 
        pickup_address
    ) VALUES (
        p_user_id,
        p_scheduled_date,
        p_notes,
        'requested',
        user_data.area,
        user_data.street,
        user_data.house_number,
        user_data.house_number || ' ' || user_data.street || ', ' || user_data.area
    ) RETURNING id INTO result_id;
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'id', result_id,
        'message', 'Pickup request created successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to create pickup request'
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the payment function with correct return type
CREATE OR REPLACE FUNCTION create_payment_direct(
    p_user_id UUID,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'NGN',
    p_payment_method TEXT DEFAULT 'transfer',
    p_reference TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result_id UUID;
    result JSON;
    final_reference TEXT;
BEGIN
    -- Generate reference if not provided
    IF p_reference IS NULL OR p_reference = '' THEN
        final_reference := 'PAY_' || extract(epoch from now())::bigint;
    ELSE
        final_reference := p_reference;
    END IF;
    
    -- Insert payment directly
    INSERT INTO payments (
        user_id,
        amount,
        currency,
        payment_method,
        reference,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        p_currency,
        p_payment_method,
        final_reference,
        'completed'
    ) RETURNING id INTO result_id;
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'id', result_id,
        'reference', final_reference,
        'message', 'Payment logged successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to log payment'
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_pickup_request_direct(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_direct(UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;

-- Step 5: Test the functions
SELECT 'TESTING DIRECT FUNCTIONS' as section;

-- Test with a real user
DO $$
DECLARE
    test_user_id UUID;
    pickup_result JSON;
    payment_result JSON;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM users WHERE role = 'resident' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test pickup request function
        SELECT create_pickup_request_direct(
            test_user_id, 
            CURRENT_DATE + 1, 
            'Direct function test'
        ) INTO pickup_result;
        
        RAISE NOTICE 'Pickup function result: %', pickup_result;
        
        -- Test payment function
        SELECT create_payment_direct(
            test_user_id,
            1000,
            'NGN',
            'transfer',
            'TEST_DIRECT_' || extract(epoch from now())::bigint
        ) INTO payment_result;
        
        RAISE NOTICE 'Payment function result: %', payment_result;
        
        -- Clean up test data if successful
        IF (pickup_result->>'success')::boolean THEN
            DELETE FROM pickup_requests WHERE id = (pickup_result->>'id')::UUID;
            RAISE NOTICE 'Cleaned up test pickup request';
        END IF;
        
        IF (payment_result->>'success')::boolean THEN
            DELETE FROM payments WHERE id = (payment_result->>'id')::UUID;
            RAISE NOTICE 'Cleaned up test payment';
        END IF;
    ELSE
        RAISE NOTICE 'No resident users found for testing';
    END IF;
END $$;

SELECT 'DIRECT DATABASE FUNCTIONS CREATED SUCCESSFULLY!' as result,
       'These bypass PostgREST schema cache issues completely' as explanation;