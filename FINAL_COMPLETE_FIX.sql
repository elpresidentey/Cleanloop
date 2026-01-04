-- ==========================================================
-- FINAL COMPLETE FIX FOR CLEANLOOP PRODUCTION
-- ==========================================================
-- Run this entire script in Supabase Dashboard -> SQL Editor
-- It fixes:
-- 1. Missing public user profiles (Foreign Key errors)
-- 2. Schema mismatches (payment_reference vs reference)
-- 3. Defines missing RPC functions for Strategy 3
-- ==========================================================

-- 1. SYNC AUTH USERS TO PUBLIC USERS
-- This ensures every signed-up user has a public profile
INSERT INTO public.users (id, email, name, role, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', 'User ' || substr(id::text, 1, 6)),
    COALESCE(raw_user_meta_data->>'role', 'resident'),
    created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 2. ENSURE PAYMENTS TABLE HAS CORRECT COLUMNS
-- We standardize on 'payment_reference'. If 'reference' exists, we rename it or keep both synced?
-- Let's just ensure 'payment_reference' exists.
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_reference') THEN
    -- If reference exists, rename it, otherwise add payment_reference
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reference') THEN
      ALTER TABLE public.payments RENAME COLUMN reference TO payment_reference;
    ELSE
      ALTER TABLE public.payments ADD COLUMN payment_reference TEXT;
    END IF;
  END IF;
END $$;

-- 3. ENSURE PICKUP_REQUESTS HAS ADDRESS COLUMN
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'pickup_address') THEN
    ALTER TABLE public.pickup_requests ADD COLUMN pickup_address TEXT DEFAULT 'Lagos Island';
  END IF;
END $$;

-- 4. DEFINE DIRECT PAYMENT FUNCTION (Strategy 3)
CREATE OR REPLACE FUNCTION create_payment_direct(
  p_user_id UUID,
  p_amount DECIMAL,
  p_currency TEXT,
  p_payment_method TEXT,
  p_reference TEXT
) RETURNS JSONB AS $$
DECLARE
  v_payment_id UUID;
  v_result JSONB;
BEGIN
  -- Verify user exists in public table first
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    -- Try to sync from auth
    INSERT INTO public.users (id, email, name, role)
    SELECT id, email, 'Synced User', 'resident'
    FROM auth.users WHERE id = p_user_id;
  END IF;

  INSERT INTO public.payments (
    user_id,
    amount,
    currency,
    payment_method,
    payment_reference, -- We ensured this column exists above
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_currency,
    p_payment_method,
    p_reference,
    'completed',
    NOW()
  ) RETURNING id INTO v_payment_id;

  v_result := jsonb_build_object(
    'success', true,
    'id', v_payment_id,
    'reference', p_reference
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. DEFINE DIRECT PICKUP FUNCTION (Strategy 3)
CREATE OR REPLACE FUNCTION create_pickup_request_direct(
  p_user_id UUID,
  p_scheduled_date DATE,
  p_notes TEXT,
  p_pickup_address TEXT
) RETURNS JSONB AS $$
DECLARE
  v_pickup_id UUID;
  v_result JSONB;
BEGIN
  -- Verify user
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    INSERT INTO public.users (id, email, name, role)
    SELECT id, email, 'Synced User', 'resident'
    FROM auth.users WHERE id = p_user_id;
  END IF;

  INSERT INTO public.pickup_requests (
    user_id,
    scheduled_date,
    special_instructions, -- Mapping notes to special_instructions matches setup
    status,
    pickup_address,
    created_at
  ) VALUES (
    p_user_id,
    p_scheduled_date,
    p_notes,
    'requested',
    p_pickup_address,
    NOW()
  ) RETURNING id INTO v_pickup_id;

  v_result := jsonb_build_object(
    'success', true,
    'id', v_pickup_id
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION create_payment_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_direct TO service_role;
GRANT EXECUTE ON FUNCTION create_pickup_request_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_pickup_request_direct TO service_role;

SELECT 'FINAL FIX APPLIED SUCCESSFULLY - Try App Now' as status;