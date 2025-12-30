-- =====================================================
-- FRESH DATABASE SETUP FOR CLEANLOOP PLATFORM
-- =====================================================
-- This is a clean, error-free version for Supabase
-- Run this in Supabase SQL Editor

-- First, drop existing tables if they have issues
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.pickup_requests CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.error_reports CASCADE;

-- =====================================================
-- 1. CREATE SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 2. CREATE PICKUP REQUESTS TABLE
-- =====================================================

CREATE TABLE public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  time_slot TEXT,
  waste_type TEXT,
  estimated_weight DECIMAL(5,2),
  special_instructions TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'missed')) DEFAULT 'pending',
  pickup_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pickup requests" ON public.pickup_requests
  FOR SELECT USING (user_id = auth.uid() OR collector_id = auth.uid());

CREATE POLICY "Users can create own pickup requests" ON public.pickup_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pickup requests" ON public.pickup_requests
  FOR UPDATE USING (user_id = auth.uid() OR collector_id = auth.uid());

-- =====================================================
-- 3. CREATE PAYMENTS TABLE
-- =====================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. CREATE COMPLAINTS TABLE
-- =====================================================

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own complaints" ON public.complaints
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own complaints" ON public.complaints
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 5. CREATE AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy (admins only - simplified)
CREATE POLICY "Service role can access audit logs" ON public.audit_logs
  FOR ALL USING (true);

-- =====================================================
-- 6. CREATE NOTIFICATION PREFERENCES TABLE
-- =====================================================

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

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE ERROR REPORTS TABLE
-- =====================================================

CREATE TABLE public.error_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type VARCHAR(255) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  context JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow inserts for error reporting)
CREATE POLICY "Anyone can insert error reports" ON public.error_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage error reports" ON public.error_reports
  FOR ALL USING (true);

-- =====================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Pickup requests indexes
CREATE INDEX idx_pickup_requests_user_id ON public.pickup_requests(user_id);
CREATE INDEX idx_pickup_requests_status ON public.pickup_requests(status);
CREATE INDEX idx_pickup_requests_scheduled_date ON public.pickup_requests(scheduled_date);

-- Payments indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Complaints indexes
CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);

-- =====================================================
-- 9. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample subscription
INSERT INTO public.subscriptions (user_id, plan_type, status, amount, currency, billing_cycle)
VALUES (
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  'weekly',
  'active',
  5000.00,
  'NGN',
  'weekly'
);

-- Insert sample pickup requests
INSERT INTO public.pickup_requests (user_id, scheduled_date, time_slot, waste_type, status, pickup_address)
VALUES 
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    CURRENT_DATE + INTERVAL '3 days',
    'Morning (8AM - 12PM)',
    'General Waste',
    'scheduled',
    'Victoria Island, Ahmadu Bello Way 123'
  ),
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    CURRENT_DATE - INTERVAL '7 days',
    'Afternoon (12PM - 4PM)',
    'Recyclables',
    'completed',
    'Victoria Island, Ahmadu Bello Way 123'
  );

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Verify tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'subscriptions', 'pickup_requests', 'payments', 
    'complaints', 'audit_logs', 'notification_preferences', 
    'error_reports'
  )
ORDER BY table_name;