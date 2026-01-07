-- ==============================================================================
-- MASTER DATABASE RESET FOR CLEANLOOP PLATFORM
-- ==============================================================================
-- 
-- ⚠️  WARNING: This script will DELETE ALL EXISTING DATA in public.* tables!
--     Make sure you have backups if needed before running.
--
-- 📋 INSTRUCTIONS:
--     1. Open Supabase Dashboard -> SQL Editor
--     2. Copy this ENTIRE script
--     3. Paste and click "Run"
--     4. Verify output shows "MASTER DATABASE RESET COMPLETE"
--
-- ==============================================================================

-- ==============================================================================
-- STEP 1: DROP ALL EXISTING TABLES (Clean Slate)
-- ==============================================================================

DROP TABLE IF EXISTS public.error_reports CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.pickup_requests CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.create_payment_direct(UUID, DECIMAL, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_pickup_request_direct(UUID, DATE, TEXT, TEXT) CASCADE;

-- ==============================================================================
-- STEP 2: ENABLE EXTENSIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- ==============================================================================

-- Function to auto-update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- STEP 4: CREATE USERS TABLE
-- ==============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  name TEXT NOT NULL DEFAULT 'User',
  role TEXT NOT NULL CHECK (role IN ('resident', 'collector', 'admin')) DEFAULT 'resident',
  area TEXT DEFAULT '',
  street TEXT DEFAULT '',
  house_number TEXT DEFAULT '',
  coordinates POINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_area ON public.users(area);
CREATE INDEX idx_users_active ON public.users(is_active);
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Collectors can view resident profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'collector'
    ) AND role = 'resident'
  );

CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- STEP 5: CREATE SUBSCRIPTIONS TABLE
-- ==============================================================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('weekly', 'bi-weekly', 'on-demand')),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')) DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  billing_cycle TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_plan_type ON public.subscriptions(plan_type);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- STEP 6: CREATE PICKUP REQUESTS TABLE
-- ==============================================================================

CREATE TABLE public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  time_slot TEXT,
  waste_type TEXT,
  estimated_weight DECIMAL(5,2),
  special_instructions TEXT,
  pickup_address TEXT NOT NULL DEFAULT 'Lagos Island',
  status TEXT NOT NULL CHECK (status IN ('pending', 'requested', 'scheduled', 'in_progress', 'completed', 'cancelled', 'missed', 'picked_up')) DEFAULT 'pending',
  coordinates POINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pickup_requests_user_id ON public.pickup_requests(user_id);
CREATE INDEX idx_pickup_requests_collector_id ON public.pickup_requests(collector_id);
CREATE INDEX idx_pickup_requests_status ON public.pickup_requests(status);
CREATE INDEX idx_pickup_requests_scheduled_date ON public.pickup_requests(scheduled_date);

-- Enable RLS
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pickup requests" ON public.pickup_requests
  FOR SELECT USING (user_id = auth.uid() OR collector_id = auth.uid());

CREATE POLICY "Users can create own pickup requests" ON public.pickup_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pickup requests" ON public.pickup_requests
  FOR UPDATE USING (user_id = auth.uid() OR collector_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_pickup_requests_updated_at 
  BEFORE UPDATE ON public.pickup_requests 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- STEP 7: CREATE PAYMENTS TABLE
-- ==============================================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  pickup_request_id UUID REFERENCES public.pickup_requests(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  due_date DATE,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_payment_reference ON public.payments(payment_reference);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON public.payments 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- STEP 8: CREATE COMPLAINTS TABLE
-- ==============================================================================

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pickup_request_id UUID REFERENCES public.pickup_requests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  resolution TEXT,
  photo_url TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX idx_complaints_pickup_request_id ON public.complaints(pickup_request_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own complaints" ON public.complaints
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own complaints" ON public.complaints
  FOR UPDATE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_complaints_updated_at 
  BEFORE UPDATE ON public.complaints 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- STEP 9: CREATE AUDIT LOGS TABLE
-- ==============================================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy (admins only)
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- STEP 10: CREATE NOTIFICATION PREFERENCES TABLE
-- ==============================================================================

CREATE TABLE public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  pickup_reminders BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  complaint_updates BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  weekly_reports BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON public.notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- STEP 11: CREATE ERROR REPORTS TABLE
-- ==============================================================================

CREATE TABLE public.error_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type VARCHAR(255) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  context JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX idx_error_reports_severity ON public.error_reports(severity);
CREATE INDEX idx_error_reports_resolved ON public.error_reports(resolved);
CREATE INDEX idx_error_reports_created_at ON public.error_reports(created_at);
CREATE INDEX idx_error_reports_error_type ON public.error_reports(error_type);

-- Enable RLS
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert error reports" ON public.error_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view error reports" ON public.error_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update error reports" ON public.error_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ==============================================================================
-- STEP 12: CREATE AUTO-SYNC TRIGGER FOR USER PROFILES
-- ==============================================================================

-- This function automatically creates a public.users profile when a new auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, name, role, area, street, house_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User ' || substr(NEW.id::text, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
    COALESCE(NEW.raw_user_meta_data->>'area', ''),
    COALESCE(NEW.raw_user_meta_data->>'street', ''),
    COALESCE(NEW.raw_user_meta_data->>'house_number', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- STEP 13: CREATE BULLETPROOF RPC FUNCTIONS (Strategy 3)
-- ==============================================================================

-- These functions bypass RLS and schema cache issues

-- BULLETPROOF PAYMENT FUNCTION
CREATE OR REPLACE FUNCTION public.create_payment_direct(
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
  -- Ensure user exists in public.users (auto-sync from auth if missing)
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    INSERT INTO public.users (id, email, name, role)
    SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Synced User'), 'resident'
    FROM auth.users WHERE id = p_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Create the payment
  INSERT INTO public.payments (
    user_id,
    amount,
    currency,
    payment_method,
    payment_reference,
    status,
    payment_date,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_currency,
    p_payment_method,
    p_reference,
    'completed',
    NOW(),
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

-- BULLETPROOF PICKUP REQUEST FUNCTION
CREATE OR REPLACE FUNCTION public.create_pickup_request_direct(
  p_user_id UUID,
  p_scheduled_date DATE,
  p_notes TEXT,
  p_pickup_address TEXT
) RETURNS JSONB AS $$
DECLARE
  v_pickup_id UUID;
  v_result JSONB;
BEGIN
  -- Ensure user exists in public.users (auto-sync from auth if missing)
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    INSERT INTO public.users (id, email, name, role)
    SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Synced User'), 'resident'
    FROM auth.users WHERE id = p_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Create the pickup request
  INSERT INTO public.pickup_requests (
    user_id,
    scheduled_date,
    special_instructions,
    pickup_address,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_scheduled_date,
    p_notes,
    COALESCE(p_pickup_address, 'Lagos Island'),
    'requested',
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

-- ==============================================================================
-- STEP 14: SYNC EXISTING AUTH USERS TO PUBLIC USERS
-- ==============================================================================

-- This ensures all existing auth.users get a profile in public.users
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

-- ==============================================================================
-- STEP 15: GRANT PERMISSIONS
-- ==============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.create_payment_direct TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_direct TO service_role;
GRANT EXECUTE ON FUNCTION public.create_pickup_request_direct TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pickup_request_direct TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated;

-- ==============================================================================
-- STEP 16: VERIFY SETUP
-- ==============================================================================

-- List all created tables
SELECT '✅ TABLES CREATED:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- List all created functions
SELECT '✅ FUNCTIONS CREATED:' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Count synced users
SELECT '✅ USERS SYNCED:' as status, COUNT(*) as count FROM public.users;

-- Final success message
SELECT '🎉 MASTER DATABASE RESET COMPLETE - Your CleanLoop database is ready!' as status;
